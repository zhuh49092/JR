   var AllCommData; 
   var author='';
   var _entry='ano';
   var _key='';
   var detailData;   
    // Google Apps Script部署后的Web应用URL 
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkyPL8d0hwSFV95DctKBIICSpaN2Fj06x5uzdWz_BesK_tjdSa6qvNcy6mgi5y7978/exec';
		 function generateUniqueId() {
		  const timestamp = new Date().getTime();
		  const randomPart = Math.floor(Math.random() * 10000);
		  return `${timestamp}-${randomPart}`;
		}   
				  
 
 //向GitHub上传图片
 
      async function submitToGitHub(content, picdata, fileName,callback) {
      	// 2. 配置参数
        const settings = {
            owner: 'zhuh49092',
            repo: 'files',
            path: Date.now() + '_' + fileName, // 存储路径
            token: 'dEXcOV6Y0eyRnELD68zUtcHX74lknu31fi3c',
            branch: 'main',
            filepath: 'data/records.json'            
        };
      
        const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}`;
   
        try {
        	$.showLoading();
          const response = await $.ajax({
            url: url,
            method: 'PUT',
            headers: {
              'Authorization': `token ghp_${settings.token}`,
              'Content-Type': 'application/json'
            },
            data: JSON.stringify({
              message: '图片',
              content: picdata
            })
          });     
          $.hideLoading(); 
          // 构造图片的原始URL
          const rawUrl = `https://raw.githubusercontent.com/${settings.owner}/${settings.repo}/main/${settings.path}`;
          callback({success:true, picurl:rawUrl});          	
        } catch (error) {
        	$.hideLoading(); 
          const errorMessage = error.responseJSON ? error.responseJSON.message : '未知错误';
          callback( {success:false, message:errorMessage});
        }
      }

      //上传数据(图片，评论)
       function SendData(imageFile,commitMessage){
       	if (!imageFile)
       	{
          var datas={
	            	rid:generateUniqueId(),
	            	gname:author,
	            	content:commitMessage,
	            	picture:'',
	            	entry_type:_entry,
	            	key_id:_key,
	            	likes:0,
	            	comments:0
	            }            
	            try {
	                  postData('save',datas,function(data){
	                  	showResult('记录添加成功', 'success');
	                  	addNewCard(datas) ;
	                  	setTimeout(() => {hideModal("#modalOverlay");
	                  
					            
	                  		},500);					                  	 	  
	                  });                              					                  
	            } catch (error) {
	                showResult('提交失败：' + error.message, 'error');
	            }      
	            return;      		
       	}
 				compressImageToBase64(imageFile)
				  .then(base64Data => {
						submitToGitHub(commitMessage, base64Data, imageFile.name,function(result){
	         		   if(result.success)
 	         	       {
					            var pdatas={
					            	rid:generateUniqueId(),
					            	gname:author,
					            	content:commitMessage,
					            	picture:result.picurl,
        					    	entry_type:_entry,
	      				      	key_id:_key,					            	
					            	likes:0,
					            	comments:0
					            }            
					            try {
					                  postData('save',pdatas,function(data){
					                  	showResult('记录添加成功', 'success');
					                  	addNewCard(pdatas) ;
					                  	setTimeout(() => {hideModal("#modalOverlay");
					                  	
					                    
					                  		},500);					                  	 	  
					                  });                              					                  
					            } catch (error) {
					                showResult('提交失败：' + error.message, 'error');
					            }      	       	 	         	       		         	       	
 	         	      }	         	       
	           		 else
 	           		   showResult('提交失败: ' + result.message, 'error');
 	           	});
				  })
				  .catch(error => {
				    console.error('提交失败:', error.message);
				  });     	
      }
    
     
      
    function compressImageToBase64(imageFile) {
         return new Promise((resolve, reject) => {
    			const maxWidth = 1024;
   			  const quality = 0.9;
 
   			 if (!imageFile.type.match('image.*')) {
     					 reject(new Error('请选择图片文件'));
     				 return;
   					 }
			    
			    // 创建FileReader读取图片
			    const reader = new FileReader();    
			    reader.onload = function(e) {
			      const img = new Image();
			      
			      img.onload = function() {
			        try {
			          const canvas = document.createElement('canvas');
			          let width = img.width;
			          let height = img.height;
			           if (width > maxWidth) {
			            const ratio = height / width;
			            width = maxWidth;
			            height = Math.round(maxWidth * ratio);
			          }    
			           canvas.width = width;
			          canvas.height = height;
			          const ctx = canvas.getContext('2d');
			          ctx.drawImage(img, 0, 0, width, height);
			          
			          // 转换为base64数据URL并提取base64部分
			          const dataURL = canvas.toDataURL('image/jpeg', quality);
			          const base64Data = dataURL.split(',')[1];
			          resolve(base64Data);
			        } catch (error) {
			          reject(new Error('图片处理失败: ' + error.message));
			        }
			      };
      
		      img.onerror = function() {
		        reject(new Error('图片加载失败'));
		      };
		      
		      img.src = e.target.result;
		    };
		    
		    reader.onerror = function() {
		      reject(new Error('文件读取失败'));
		    };
    
    reader.readAsDataURL(imageFile);
  });
}

       // 加载数据
        async function getData(maction) {
            const url = new URL(SCRIPT_URL);
            url.searchParams.append('action', maction);
            try {           	
							  const response = await fetch(url);							  
							  if (!response.ok) {
							    throw new Error(`HTTP error! status: ${response.status}`);
							  }						  
							 const result = await response.json();          
                if (result.success) {
                    return (result.data);
                } else {
                    throw new Error(result.message || '获取数据失败');
                }
            } catch (error) {
                throw new Error(error);
            }
        }
                   
         //提交数据
        async function postData(maction,pdatas,callback) {   
        try{ 
        	 $.showLoading();
         const response=await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // 必须使用 no-cors 以避开跨域限制
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                        action: maction,
                        record: pdatas
                    })
            });
            $.hideLoading(); 
               if(callback)callback(pdatas);	       
          } catch (error) {
          	$.hideLoading(); 
            	  throw new Error(error);
            }    	
        }              
 
 
       function showModal(modalOverlay) {      	
        $(modalOverlay).removeClass('hidden');
      }

      function hideModal(modalOverlay) {
          $(modalOverlay).addClass('hidden');
      }    

       //点赞
        async function likeCard(_id){
            try {
                  var data=await postData('addlike',{id:_id,entry_type:_entry,key_id:_key,name:author});
									addLike_comm(_id,0);

            } catch (error) {
                console.error('提交失败:', error);
                alert('提交失败：' + error.message);
            } 	
        }
        //评论
       async function PostComment(_id,commentConent){
 						try {
                  var data=await postData('comment',{rid:_id,comment:commentConent,entry_type:_entry,key_id:_key,name:author},function(data){
					                  	showResult('评论成功', 'success');
											addLike_comm(_id,3);
											var card=$('[data-id="'+_id+'"]');
					            addComment(card,{name:author,cdate:getCurrentTimeString(),comment:commentConent});
					            ChangeCardHeight(card);   	
					            setTimeout(() => {hideModal("#modalOverlay");

					            
					            	},500);					                  	 	  
					                  });                                                  
            } catch (error) {
      		      	showResult('评论提交失败：' + error.message, 'error');
            }     	       	 	         	       		         	       	   	
      }
      //更新点赞数
      function addLike_comm(_id,index){ //index为0是点赞,3是评论
      	  var card=$('[data-id="'+_id+'"]');  
      	  if(card){
         	var likec=card.find(".likec");
				  const parts = likec.text().split(' ');
		    	 if (parts.length > 0) {
	                parts[index] = parseInt(parts[index])+1;
	                likec.text(parts.join(' '));
					}  	
				}
      }
     //浏览
      async function ViewCard(_id){
          try {
                var data=await postData('view',{rid:_id,entry_type:_entry,key_id:_key,name:author});
								//addView_comm(_id,0);
          } catch (error) {
              console.error('提交失败:', error);
              alert('提交失败：' + error.message);
          } 	
      }
              
 // 添加新卡片
function addNewCard(row,isfirst=0) {
        const newCard = {
            id: row.id||row.rid,
            type:'image',
            title: ``,
            image: row.picture,
            content: row.content,
            likes: row.likes,
            comments: row.comments
        };              
       const cardElement = createCardElement(newCard, isfirst==1); 
        insertAfterSecond($('#waterfallContainer'), cardElement);
        //加入评论
        var Cdata=GetCommData(row.id||row.rid);
        if(Cdata.length>0){
          Cdata.forEach((row, index) => {
							 addComment(cardElement,{name:row.name,cdate:row.cdate,comment:row.comment})       
            });  
          }                    
       isImgLoad();               
}
 

function insertAfterSecond(targetSelector, newElement) {
  const target = $(targetSelector);
  const secondChild = target.children().eq(0);
  if (secondChild.length) {
    $(newElement).insertAfter(secondChild);
  } else {
    target.append(newElement); // 如果少于两个子节点，追加到最后
  }
}
 
function getcarddata(e){ 	     
	    const _id=e.data.id;
      var card=$('[data-id="'+_id+'"]'); 
      var likec=card.find(".likec");
			const parts = likec.text().split(' ');  
			var Cdata=GetCommData(_id);  
      var pdatas={
      	rid:_id,
      	gname:author,
      	content:card.find('#c'+_id).html(),
      	picture:card.find('.card-image').attr('src'),
      	likes:parts[0],
      	comments:parts[3],
      	data:Cdata
      }    
      saveDataToLocal("detailData",pdatas);
      window.location.href="detail.html" 	     
}      
					  
       // 创建卡片元素
function createCardElement(card, isFeatured = false) {
    const classes = `waterfall-card fade-in ${isFeatured ? 'featured-card' : ''} card-${card.type}`;    
    const $cardElement = $('<div>', {
        class: classes,
        'data-type': card.image?card.type:'text',
        'data-id': card.id
    });   
    if (card.image) {
        var cimg=$('<img>', {
            src: card.image,
            alt: card.title,
            class: `card-image w-full ${isFeatured?'':'cursor-pointer'}`
        });
        cimg.appendTo($cardElement);
        if(!isFeatured)cimg.on('click',{id:card.id},getcarddata); 
    }   
    const $contentDiv = $('<div>', { class: 'p-3' }).appendTo($cardElement);   
   // $('<h3>', {   class: 'card-title text-xl font-bold mb-3',    text: card.title }).appendTo($contentDiv);
    
    $('<p>', {
        class: 'card-text whitespace-pre-line text-gray-600 mb-4',
        id:'c'+card.id,
        text: card.content
    }).appendTo($contentDiv);
if(!isFeatured){    
    const $metaDiv = $('<div>', {
        class: 'card-meta border-t border-gray-100 pt-4 flex justify-between items-center'
    }).appendTo($contentDiv);
    
    $('<span>', {
        class: 'text-gray-500 text-sm likec',
        text: `${card.likes} 赞 · ${card.comments} 评论`
    }).appendTo($metaDiv);
    
    const $buttonDiv = $('<div>', { class: 'flex space-x-2' }).appendTo($metaDiv);
    
    $('<button>', {
        class: 'p-2 rounded-full hover:bg-gray-100 transition-colors',
        click: () => likeCard(card.id),
        html: '<i class="fas fa-thumbs-up"></i>'
    }).appendTo($buttonDiv);
    
    $('<button>', {
        class: 'p-2 rounded-full hover:bg-gray-100 transition-colors',
        click: () => commentCard(card.id),
        html: '<i class="fas fa-comment"></i>'
    }).appendTo($buttonDiv);
}    
    
    const commentDiv=$('<div>',{
    	        class: 'space-y-2 text-xs comment'
    	      }).appendTo($contentDiv);       	      
    return $cardElement[0];
}
  //加入一条评论
  function addComment(card,record){
  	var commdivp=$(card).find(".comment");
  	//const commDiv=$('<div>',{class:'border-b border-gray-100 pb-5 last:border-0 last:pb-0'});
  	const commDiv=$('<div>',{class:'flex items-start'});
  	//commDiv2.appendTo(commDiv);  	
  	var ldiv=$('<div>',{class:`avatar-icon icon-${getRandomInt(1,5)}`});
  	ldiv.appendTo(commDiv);
  	$('<i>',{class:"fas fa-user"}).appendTo(ldiv);
  	
  	const writerDiv0=$('<div>',{class:'flex-1'});
  	writerDiv0.appendTo(commDiv);
   	const writerDiv=$('<div>',{class:'flex items-center mb-1'})
   	writerDiv.appendTo(writerDiv0);
    $('<h4>', {class: 'text-gray-800',text:record.name}).appendTo(writerDiv); 
    $('<span>', {class: 'mx-2 text-gray-300',text:'?'}).appendTo(writerDiv); 	
    $('<span>', {class: 'text-xs text-gray-500',text:`${formatTime(record.cdate)}`}).appendTo(writerDiv); 
    $('<p>', {class: 'text-gray-600',
        html: record.comment
    }).appendTo(writerDiv0);
  	insertAfterSecond(commdivp,commDiv);  	
  }

  // 计算并设置卡片高度
  function calculateAndSetCardHeights() {
		   const $cards = $('.waterfall-card');
		    $cards.each(function() {
		        ChangeCardHeight($(this));
		    });
  }
  function ChangeCardHeight(card){
	    const $contentDiv = $(card).find('div:last-child');
	    if ($contentDiv.length) {
	        const contentHeight = $contentDiv[0].scrollHeight;
	        let totalHeight = contentHeight;
	        const $image = $(card).find('.card-image');
	        if ($image.length) {
	            totalHeight += $image[0].offsetHeight;
	        }
	        const rowSpan = Math.ceil((totalHeight + 20) / 30);
	        $(card).css('grid-row-end', `span ${rowSpan}`);
	    }
  }

  //检测图片是否加载完毕
	 function isImgLoad() {
		    $('.card-image').each(function() {
		        if (this.height === 0) { 
		            setTimeout(isImgLoad, 500);
		            return false;
		        }
		    });
		    setTimeout(calculateAndSetCardHeights, 200);
		}
	//生成随机数	
	  function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }	
    
    //获取每张卡片的评论
    function GetCommData(_id){
    	let filteredData = filterData(AllCommData,_id);
      const sortedData = sortData(filteredData);   
      return  sortedData;
    }
    // 筛选数据
    function filterData(data,_id) {       
        let filtered = $.makeArray(data);
         filtered = filtered.filter(item =>item.pid===_id);
        return filtered;
    }
    
    // 排序数据
    function sortData(data) {
        const sortField = "Cdate";
        const sortOrder = "desc";        
        return data.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];
            
            // 处理字符串比较
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    function filterTop5(data) {
        return data.slice(0, 5);
    }
     
		function formatTime(isoString) {
		    const targetDate = new Date(isoString);
		    const currentDate = new Date();
		    const diffTime = Math.abs(currentDate - targetDate);
		    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		    if (diffDays < 30) {
		        return `${diffDays}天之前`;
		    } else if (diffDays < 365) {
		        const diffMonths = Math.floor(diffDays / 30);
		        return `${diffMonths}月之前`;
		    } else {
		        const diffYears = Math.floor(diffDays / 365);
		        return `${diffYears}年之前`;
		    }
		}
		function getCurrentTimeString() {
		    return new Date();
		}		
			// 保存数据
		function saveGuestName(key, value) {
		    localStorage.setItem(key, value);
		}
		function saveDataToLocal(key, value) {
		    localStorage.setItem(key, JSON.stringify(value));
		}	
		
		function saveDataToSession(key, value) {
		    sessionStorage.setItem(key, JSON.stringify(value));
		}	
		function getDatafromSession(key) {
		    const data = sessionStorage.getItem(key);
		    return data ? $.parseJSON(data) : '';
		}		
				
		// 读取数据
			// 读取数据
		function getGuestName(key) {
		    const data = localStorage.getItem(key);
		    return data ? data : '';
		}	
		function getDatafromLocal(key) {
		    const data = localStorage.getItem(key);
		    return data ? $.parseJSON(data) : '';
		}
		
		//生成弹窗内的元素
		function makeform(confing){
			var pdiv=$("#formContent");
			pdiv.empty();
			 confing.forEach((row, index) => {
				var commDiv=makeinput(row.type,row.id,row.title,row.tip,row.value);
				commDiv.appendTo(pdiv)				            
     });
     $("#submitBtn").prop('disabled', false);
     $('#result').addClass('hidden');
    }
     
    function makeinput(type,id,title,tip,value){     
			var commDiv;
			switch(type){
				case 'image':
  	          commDiv=$('<div>');
              $('<label>', {class: 'block text-gray-700 font-medium mb-2',text:title}).appendTo(commDiv); 
              var ldiv=$('<div>',{class:'image-preview-container rounded-lg overflow-hidden relative'});
              ldiv.on('click', function() {$('#imageFile').click();});            
              ldiv.appendTo(commDiv);
              var ldiv2=$('<div>',{id:'imagePreviewPlaceholder',class:'image-preview-placeholder'});
              ldiv2.appendTo(ldiv);
              $('<i>', {class: 'fas fa-cloud-upload-alt text-4xl mb-3'}).appendTo(ldiv2); 
              $('<p>', {class: 'text-lg font-medium',text:tip}).appendTo(ldiv2); 
              $('<p>', {class: 'text-sm mt-2',text:'Drag and drop files here'}).appendTo(ldiv2); 
              $('<img>', {class: 'preview-image hidden',id:'imagePreview',src:'', alt:'picture preview' }).appendTo(ldiv); 
              var imgfile=$('<input>', {class: 'hidden-file-input',id:id,type:'file', accept:'image/*' });
              imgfile.appendTo(commDiv);
              imgfile.on('change', bindImage);                       
              break;			
				case 'text':
				      commDiv=$('<div>');
				      $('<label>', {class: 'block text-gray-700 font-medium mb-2',text:title}).appendTo(commDiv); 
	            $('<textarea>', {class: 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none',
	            	type:'text',rows:'4',id:id,placeholder:tip,value:''}).appendTo(commDiv); 	
	            	break;
		  	case 'input':
				      commDiv=$('<div>');
				      $('<label>', {class: 'block text-gray-700 font-medium mb-2',text:title}).appendTo(commDiv); 
	            $('<input>', {class: 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none',
	            	type:'text',id:id,placeholder:tip,value:''}).appendTo(commDiv); 	
	            	break;
	      case 'hidden':
	              commDiv=$('<input>', {type: 'hidden',id:id,value:value});
	            break;
				default:
				      commDiv=$('<div>');
			}
			return commDiv;
		}
		
		//根据ID生成详情页面所需的json数据
		function getDetailData(_id)
		{
			
		}
		
    $('#modalOverlay').on('click', function(event) {
        if (event.target === modalOverlay) {
            hideModal('#modalOverlay');
        }
    });
 
 function bindImage(e)
  {
        const file = e.target.files[0];
        if (file) {
          // 检查文件类型
          if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            $(this).val('');
            resetPreview();
            return;
          }

          // 显示预览
          const reader = new FileReader();
          reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
              $('#imagePreview').attr('src', e.target.result).removeClass('hidden');
              $('#imagePreviewPlaceholder').hide();
              let displayWidth = img.width;
              let displayHeight = img.height;
              let fileSize = (file.size / 320).toFixed(1);
              
					     // 第一次缩放：确保宽度不超过320
					    if (displayWidth > 320) {
					        const ratio = displayHeight / displayWidth;
					        displayWidth = 320;
					        displayHeight = Math.round(320 * ratio);
					    }
					    
					    // 第二次缩放：确保高度不超过320
					    if (displayHeight > 320) {
					        const ratio = displayWidth / displayHeight;
					        displayHeight = 320;
					        displayWidth = Math.round(320 * ratio);
					    }  
                $('#imagePreview').width(displayWidth);
                $('#imagePreview').height(displayHeight);
                            
              
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          resetPreview();
        }  	
  }
    function resetPreview() {
      $('#imagePreview').attr('src', '').addClass('hidden');
     $('#imagePreviewPlaceholder').show();       
    }
    
    function showResult(message, type) {
      const $resultDiv = $('#result');
      if (type === 'success') {
        $resultDiv.removeClass('bg-red-50 text-red-700 border-red-200')
                 .addClass('bg-green-50 text-green-700 border-green-200');
      } else {
        $resultDiv.removeClass('bg-green-50 text-green-700 border-green-200')
                 .addClass('bg-red-50 text-red-700 border-red-200');
      }
      $resultDiv.html(message).removeClass('hidden');       
    }
    
          
    function getParamFormUrl(){
    	try
    	{
    		author=getGuestName("author"); 
         const url = new URL(window.location.href);
         const params = new URLSearchParams(url.search);
         const pv1 = params.get('entry');
         const pv2 = params.get('key'); 
         if(pv1 && pv2){
         	_entry=pv1;
         	_key=pv2
           	saveDataToSession('visit', {_entry:_entry,_key:_key}) ;
         	}
         	else
         	{
         			var visitData=getDatafromSession('visit');
         			if(visitData==''){
         				_entry='';
         				_key='';
         			}
         			else
         				{
								_entry=visitData._entry;
         				_key=visitData._key;         					
         			}
         	}        
       }
      catch{}
         
         	
    }


$(function() {
    // 显示加载提示
    $.showLoading = function() {
        // 创建遮罩层
        const overlay = $('<div id="loadingOverlay"></div>');
        overlay.css({
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': '9999'
        });
        
        // 创建加载图标
        const spinner = $('<div id="loadingSpinner"></div>');
        spinner.css({
            'width': '50px',
            'height': '50px',
            'border': '5px solid #f3f3f3',
            'border-top': '5px solid #3498db',
            'border-radius': '50%',
            'animation': 'spin 1s linear infinite'
        });
        
        // 添加CSS动画
        const style = $('<style>').text(`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `);
        $('head').append(style);
        
        // 组装元素
        overlay.append(spinner);
        $('body').append(overlay);
        
        // 阻止页面滚动
        $('body').css('overflow', 'hidden');
    };
    
    // 隐藏加载提示
    $.hideLoading = function() {
        $('#loadingOverlay').remove();
        $('body').css('overflow', 'auto');
    };
});


$(document).ready(function() {
		getParamFormUrl(); 
    var _id='';
    if(detailData)_id=detailData.rid;		
    if (sessionStorage.getItem('jr_'+_id) === 'true') {       
    } else {
        sessionStorage.setItem('jr_'+_id, 'true');
         ViewCard(_id);

    }
});