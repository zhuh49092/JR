detailData=getDatafromLocal('detailData');
$(document).ready(function() {
	  $('#closeModalBtn').on('click', function(){hideModal('#modalOverlay')});
    if(detailData.length==0){
    	return;
    }
     getParamFormUrl();
    // 初始化页面数据
    function initPageData() {
        $('#detailTitle').text('夢見ヶ崎動物公園新聞スペース');
        $('#detailContent').text(detailData.content);
        $('#detailImage').attr('src', detailData.picture);
        $('#commentCount').text(detailData.comments);
        $('#likeCount').text(detailData.likes);
         
        // 渲染评论列表
        renderComments();      
    }

    // 渲染评论列表
    function renderComments() {
        const commentsContainer = $('#commentsContainer');
        commentsContainer.empty();        
        detailData.data.forEach(comment => {
            const commentElement = `
                <div class="flex items-start bg-white border-b border-gray-300 border-dotted p-1">
                <div class="avatar-icon icon-${getRandomInt(1,5)}"><i class="fas fa-user"></i></div>
                 <div class="flex-1 ">
                    <div class="flex justify-between items-start text-xs mb-2">
                        <span class="font-medium text-gray-800">${comment.name}</span>
                        <span class="text-xs text-gray-500">${formatTime(comment.cdate)}</span>
                    </div>
                    <p class="text-gray-600 text-xs">${comment.comment}</p>
                </div></div>
            `;
            commentsContainer.append(commentElement);
        });
    }

    // 提交评论表单
    $('#commentForm').on('submit', submitcomment);
    
    async function submitcomment(e) {
        e.preventDefault();
        if(author==''){
       	  	authorWin(2,e);
       	  	return;
       	  }        
        const commentText = $('#commentText').val().trim();
        if (commentText === '') {
            $("#warninfo").show().html("请输入评论内容");
            return;
        }
        
        const newComment = {
            id: detailData.comments.length + 1,
            name: author,
            comment: commentText,
            cdate: getCurrentTimeString()
        };
 
				try {
              var data=await postData('comment',{rid:detailData.rid,comment:commentText,entry_type:_entry,key_id:_key,name:author},function(data){
					        // 添加到数据中
					        detailData.data.unshift(newComment);       
					        // 重新渲染评论列表
					        renderComments();        
					        // 更新评论数量
					        $('#commentCount').text(detailData.data.length);
					        // 清空表单
					        $('#commentText').val('');	
					        startAnimation(3);
					        launchConfetti();					        
					        // 滚动到最新评论
					        $('#commentsContainer').scrollTop(0);					        			                  	 	  
			                  });                                                  
        } catch (error) {
        	    $("#warninfo").show().html('评论提交失败：' + error.message);
        }  
    }
        function authorWin(_type,e){    	
        	makeform([{type:'input',id:'author',title:'请留下你的姓名',tip:'第一次发言，请告诉大家你是谁！'}
        	]);
        	$('#submitBtn').html('确定');
        	$('#submitForm').off('submit'); 
 	        $('#submitForm').on('submit', function(e) {
		        e.preventDefault();
		        var $resultDiv = $('#result');
		        $resultDiv.addClass('hidden');
		        author=$("#author").val();	
	          if (author=='') {
		          showResult('姓名不能为空', 'error');
		          return;
		        }		        	        
		         $("#submitBtn").prop('disabled', true);
		        saveGuestName("author", author)	
		        hideModal("#modalOverlay"); 
		        $("#user").html(author);  
		        if(_type==2)
		            submitcomment(e);
		         else
		         	addlikes();
		      });       	      	
        	showModal("#modalOverlay"); 
        }           
    // 初始化页面
    initPageData();
});
     //点赞
    async function addlikes(){
	          if(author==''){
	       	  	authorWin(3,'');
	       	  	return;
	       	  }   	
             try {
                  var data=await postData('addlike',{id:detailData.rid,entry_type:_entry,key_id:_key,name:author});   
					        // 更新点赞数量
					        var oldlike=$('#likeCount').text();					        
					        $('#likeCount').text(parseInt(oldlike)+1);				
					        startAnimation(1);	        
            } catch (error) {
                $("#warninfo").show().html('点赞失败：' + error.message);
            } 	   	
    }
    function goBack() {
        window.history.back();
    }