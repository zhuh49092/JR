// 核心功能逻辑

let plants = [];
let newPlants = []; // 新种植的花草记录，将来要提交到后台
let currentPlantId = 0;
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;
let currentModalPlant = null;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
}

function chance(p) {
    return Math.random() < p;
}

// 筛选数据（从 pubjs.js 复制过来）
function filterData(data, _id) {
    let filteredData = data.filter(item => item.pid === _id);
    const sortedData = filteredData.sort((a, b) => {
        let valueA = a.Cdate;
        let valueB = b.Cdate;
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        return valueA < valueB ? 1 : -1;
    });
    return sortedData;
}

function getTimePeriod() {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const periods = window.GARDEN_CONFIG.timePeriods;

    if (totalMinutes >= periods.morning.start && totalMinutes < periods.morning.end) {
        return 'morning';
    } else if (totalMinutes >= periods.day.start && totalMinutes < periods.day.end) {
        return 'day';
    } else if (totalMinutes >= periods.evening.start && totalMinutes < periods.evening.end) {
        return 'evening';
    } else {
        return 'night';
    }
}

function updateTimeOverlay() {
    const period = getTimePeriod();
    const config = window.GARDEN_CONFIG.timePeriods[period];
    $('#time-overlay').css({
        'background-color': config.color,
        'opacity': config.opacity
    });
}

function updateTimeDisplay() {
    const now = new Date();
    const periodNames = { morning: '清晨', day: '白天', evening: '傍晚', night: '夜晚' };
    $('#current-time').text(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    $('#time-period').text(' · ' + periodNames[getTimePeriod()]);
}

function isNight() {
    return getTimePeriod() === 'night';
}

function isDay() {
    const period = getTimePeriod();
    return period === 'day' || period === 'morning' || period === 'evening';
}

function createPlant() {
    const cfg = window.GARDEN_CONFIG;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const worldX = (containerWidth / 2 - translateX) / scale - 40 + rand(-100, 100);
    const worldY = (containerHeight / 2 - translateY) / scale - 40 + rand(-100, 100);

    // 创建新的花草记录
    const imageIndex = randInt(0, cfg.plantImages.length - 1);
    const timestamp = Date.now();
    
    const newPlant = {
        id: currentPlantId++,
        recordId: 'new-' + timestamp, // 新花草的唯一ID
        imageIndex: imageIndex,
        image: cfg.plantImages[imageIndex],
        userImage: 'img/A' + (randInt(1, 30)) + '.png',
        userContent: '',
        userName: '新用户', // 默认用户名
        x: worldX,
        y: worldY,
        likes: 0,
        comments: [],
        isNew: true, // 标记为新种植的花草
        createdTime: new Date().toISOString()
    };

    // 保存到plants数组
    plants.push(newPlant);
    
    // 保存到newPlants数组，将来要提交到后台
    newPlants.push({
        id: newPlant.recordId,
        imageIndex: imageIndex,
        imageName: cfg.plantImages[imageIndex].split('/').pop(),
        userImage: newPlant.userImage,
        x: worldX,
        y: worldY,
        createdTime: newPlant.createdTime
    });
    
    // 显示花草
    renderPlant(newPlant, true);
    
    console.log('新种植的花草记录：', newPlant);
    console.log('待提交的花草列表：', newPlants);
}

function renderPlant(plant, showArrows) {
    const cfg = window.GARDEN_CONFIG;
    const $plant = $('<div class="plant" data-id="' + plant.id + '"></div>');
    $plant.css({ left: plant.x + 'px', top: plant.y + 'px' });

    const $img = $('<img src="' + plant.image + '" alt="plant">');
    
    // 根据是否有文字内容决定显示方式
    let $userImage;
    if (plant.userContent && plant.userContent.trim() !== '') {
        // 显示文字内容
        $userImage = $('<div class="plant-user-text">' + plant.userContent + '</div>');
    } else {
        // 显示图片
        $userImage = $('<div class="plant-user-image"><img src="' + plant.userImage + '" alt="user"></div>');
    }

    $plant.append($img, $userImage);

    if (plant.comments.length > 0) {
        $plant.append('<div class="comment-badge">' + plant.comments.length + '</div>');
    }

    // 只有新种植的花草才添加左右箭头
    if (plant.isNew) {
        const $leftArrow = $('<div class="plant-arrow plant-arrow-left">◀</div>');
        const $rightArrow = $('<div class="plant-arrow plant-arrow-right">▶</div>');
        $plant.append($leftArrow, $rightArrow);

        if (showArrows) {
            $plant.addClass('plant-new');
            // 5秒后隐藏箭头
            setTimeout(function() {
                $plant.removeClass('plant-new');
            }, 5000);
        }

        // 左箭头点击切换花草
        $leftArrow.on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            plant.imageIndex = (plant.imageIndex - 1 + cfg.plantImages.length) % cfg.plantImages.length;
            plant.image = cfg.plantImages[plant.imageIndex];
            $img.attr('src', plant.image);
        });

        // 右箭头点击切换花草
        $rightArrow.on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            plant.imageIndex = (plant.imageIndex + 1) % cfg.plantImages.length;
            plant.image = cfg.plantImages[plant.imageIndex];
            $img.attr('src', plant.image);
        });
    }

    $('#plants-layer').append($plant);
    makePlantDraggable($plant, plant);
    $plant.on('click', function(e) {
        if (!$(this).hasClass('dragging') && !$(this).data('justDragged')) {
            openModal(plant, e.clientX, e.clientY);
        }
    });
}

function makePlantDraggable($element, plant) {
    let isDraggingPlant = false;
    let hasDragged = false;
    let dragOffsetX, dragOffsetY;

    $element.on('mousedown', function(e) {
        e.stopPropagation();
        isDraggingPlant = true;
        hasDragged = false;
        $element.addClass('dragging');
        const worldPos = screenToWorld(e.clientX, e.clientY);
        dragOffsetX = worldPos.x - plant.x;
        dragOffsetY = worldPos.y - plant.y;
    });

    $(document).on('mousemove', function(e) {
        if (isDraggingPlant) {
            hasDragged = true;
            const worldPos = screenToWorld(e.clientX, e.clientY);
            plant.x = worldPos.x - dragOffsetX;
            plant.y = worldPos.y - dragOffsetY;
            $element.css({ left: plant.x + 'px', top: plant.y + 'px' });
        }
    });

    $(document).on('mouseup', function() {
        if (isDraggingPlant) {
            isDraggingPlant = false;
            $element.removeClass('dragging');
            if (hasDragged) {
                $element.data('justDragged', true);
                setTimeout(function() { $element.removeData('justDragged'); }, 100);
            }
        }
    });
}

function screenToWorld(screenX, screenY) {
    return { x: (screenX - translateX) / scale, y: (screenY - translateY) / scale };
}

function updateTransform() {
    const worldWidth = window.GARDEN_CONFIG.worldSize.width;
    const worldHeight = window.GARDEN_CONFIG.worldSize.height;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    const minScale = Math.max(containerWidth / worldWidth, containerHeight / worldHeight);
    scale = Math.max(scale, minScale);

    const worldScaledWidth = worldWidth * scale;
    const worldScaledHeight = worldHeight * scale;

    translateX = Math.max(containerWidth - worldScaledWidth, Math.min(translateX, 0));
    translateY = Math.max(containerHeight - worldScaledHeight, Math.min(translateY, 0));

    $('#garden-world').css('transform', 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')');
}

function openModal(plant, mouseX, mouseY) {
    currentModalPlant = plant;
    $('#modal-plant-info').html(
        '<p><strong>种植者：</strong><img src="' + plant.userImage + '" alt="user" style="width: 30px; height: 30px; margin-left: 10px; vertical-align: middle; border: 2px solid #fff; border-radius: 4px;"></p>' +
        '<p><strong>植物：</strong>' + plant.image.split('/').pop().replace('.png', '') + '</p>'
    );

    let commentsHtml = '';
    if (plant.comments.length === 0) {
        commentsHtml = '<p style="color: #999; text-align: center;">暂无评论，快来抢沙发吧！</p>';
    } else {
        plant.comments.forEach(function(c) {
            commentsHtml += '<div class="comment-item"><div class="comment-user">' + c.user + '</div><div class="comment-text">' + c.text + '</div></div>';
        });
    }
    $('#comment-list').html(commentsHtml);

    // 使用固定的弹窗尺寸，因为弹窗大小是固定的
    const modalWidth = 300;
    const modalHeight = 400;
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();
    const padding = 20;

    let left, top;
    if (mouseX && mouseY) {
        // 水平位置：按照用户提供的计算逻辑
        left = mouseX + 20;
        if (left + modalWidth > windowWidth - padding) {
            left = mouseX - modalWidth - 20;
        }
        
        // 垂直位置
        top = mouseY - modalHeight / 2;
        if (top < padding) {
            top = padding;
        } else if (top + modalHeight > windowHeight - padding) {
            top = windowHeight - modalHeight - padding;
        }
    } else {
        // 默认居中显示
        left = (windowWidth - modalWidth) / 2;
        top = (windowHeight - modalHeight) / 2;
    }

    // 确保完全在屏幕内
    left = Math.max(padding, Math.min(left, windowWidth - modalWidth - padding));
    top = Math.max(padding, Math.min(top, windowHeight - modalHeight - padding));

    // 设置弹窗位置
    $('#modal-content').css({
        position: 'fixed',
        left: left + 'px',
        top: top + 'px',
        zIndex: 1000
    });
    
    // 显示遮罩和弹窗
    $('#modal-overlay').fadeIn(200);
    $('#modal-content').show();
}

function closeModal() {
    $('#modal-overlay').fadeOut(200);
    $('#comment-input').val('');
    currentModalPlant = null;
}

function addComment() {
    const text = $('#comment-input').val().trim();
    if (text && currentModalPlant) {
        const comment = {
            user: window.GARDEN_CONFIG.userNames[randInt(0, window.GARDEN_CONFIG.userNames.length - 1)],
            text: text
        };
        currentModalPlant.comments.push(comment);

        const $plant = $('.plant[data-id="' + currentModalPlant.id + '"]');
        let $badge = $plant.find('.comment-badge');
        if ($badge.length === 0) {
            $badge = $('<div class="comment-badge">0</div>');
            $plant.append($badge);
        }
        $badge.text(currentModalPlant.comments.length);
        openModal(currentModalPlant);
        $('#comment-input').val('');
    }
}

function scheduleRandom(fn, minDelay, maxDelay) {
    const delay = rand(minDelay, maxDelay);
    setTimeout(function() { fn(); scheduleRandom(fn, minDelay, maxDelay); }, delay);
}

function spawnButterfly() {
    if (!isDay()) return;

    const el = document.createElement('div');
    el.className = 'bug butterfly';
    document.getElementById('ambient-layer').appendChild(el);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fromLeft = chance(0.5);
    const startX = fromLeft ? -60 : vw + 60;
    const endX = fromLeft ? vw + 60 : -60;
    const baseY = rand(vh * 0.1, vh * 0.7);
    const amplitude = rand(15, 35);
    const duration = rand(12000, 18000);
    const startTime = performance.now();
    const phase = rand(0, Math.PI * 2);

    function frame(now) {
        const t = (now - startTime) / duration;
        if (t >= 1) {
            el.remove();
            return;
        }

        const x = startX + (endX - startX) * t;
        const y = baseY + Math.sin(t * Math.PI * 4 + phase) * amplitude;
        const rotate = Math.sin(t * Math.PI * 4 + phase) * 8;

        if (x < -100 || x > vw + 100) {
            el.remove();
            return;
        }

        el.style.transform = 'translate(' + x + 'px, ' + y + 'px) scaleX(' + (fromLeft ? 1 : -1) + ') rotate(' + rotate + 'deg)';
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function spawnBee() {
    if (!isDay()) return;

    const el = document.createElement('div');
    el.className = 'bug bee';
    document.getElementById('ambient-layer').appendChild(el);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fromLeft = chance(0.5);
    const startX = fromLeft ? -60 : vw + 60;
    const endX = fromLeft ? vw + 60 : -60;
    const startY = rand(vh * 0.2, vh * 0.8);
    const endY = rand(vh * 0.2, vh * 0.8);
    const duration = rand(8000, 12000);
    const startTime = performance.now();
    const phase = rand(0, Math.PI * 2);

    function frame(now) {
        const t = (now - startTime) / duration;
        if (t >= 1) {
            el.remove();
            return;
        }

        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t + Math.sin(t * Math.PI * 6 + phase) * 20;
        const facingLeft = endX < startX;

        if (x < -100 || x > vw + 100 || y < -100 || y > vh + 100) {
            el.remove();
            return;
        }

        el.style.transform = 'translate(' + x + 'px, ' + y + 'px) scaleX(' + (facingLeft ? -1 : 1) + ')';
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function createFireflies() {
    const flies = [];
    const count = window.GARDEN_CONFIG.bugConfig.firefly.count;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'bug firefly';
        document.getElementById('ambient-layer').appendChild(el);

        flies.push({
            el: el,
            x: rand(0, window.innerWidth),
            y: rand(0, window.innerHeight),
            vx: rand(-0.12, 0.12),
            vy: rand(-0.08, 0.08),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.001, 0.0022)
        });

        el.style.animationDelay = rand(0, 2.4) + 's';
    }

    function animate(now) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const show = isNight();

        for (const f of flies) {
            f.x += f.vx;
            f.y += f.vy;
            f.x += Math.sin(now * f.speed + f.phase) * 0.15;
            f.y += Math.cos(now * f.speed * 0.8 + f.phase) * 0.12;

            if (f.x < 0 || f.x > vw) f.vx *= -1;
            if (f.y < 0 || f.y > vh) f.vy *= -1;

            f.el.style.transform = 'translate(' + f.x + 'px, ' + f.y + 'px)';
            f.el.style.display = show ? 'block' : 'none';
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function spawnMultipleButterflies() {
    const cfg = window.GARDEN_CONFIG.bugConfig.butterfly;
    for (let i = 0; i < cfg.count; i++) {
        setTimeout(spawnButterfly, i * rand(cfg.spawnDelayMin, cfg.spawnDelayMax));
    }
    scheduleRandom(spawnButterfly, cfg.minInterval, cfg.maxInterval);
}

function spawnMultipleBees() {
    const cfg = window.GARDEN_CONFIG.bugConfig.bee;
    for (let i = 0; i < cfg.count; i++) {
        setTimeout(spawnBee, i * rand(cfg.spawnDelayMin, cfg.spawnDelayMax));
    }
    scheduleRandom(spawnBee, cfg.minInterval, cfg.maxInterval);
}

function initGarden() {
    const cfg = window.GARDEN_CONFIG;

    updateTimeOverlay();
    updateTimeDisplay();
    setInterval(function() {
        updateTimeOverlay();
        updateTimeDisplay();
    }, cfg.uiConfig.timeUpdateInterval);

    $('#plant-btn').on('click', createPlant);

    $('#zoom-in').on('click', function() {
        scale = Math.min(scale * cfg.zoomConfig.scaleFactor, cfg.zoomConfig.maxScale);
        updateTransform();
    });

    $('#zoom-out').on('click', function() {
        scale = scale / cfg.zoomConfig.scaleFactor;
        updateTransform();
    });

    $('#zoom-reset').on('click', function() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    });

    $('#garden-container').on('mousedown', function(e) {
        if ($(e.target).closest('.plant').length === 0) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        }
    });

    $(document).on('mousemove', function(e) {
        if (isDragging) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        }
    });

    $(document).on('mouseup', function() { isDragging = false; });

    $('#garden-container').on('wheel', function(e) {
        e.preventDefault();
        const delta = e.originalEvent.deltaY > 0 ? 1 / cfg.zoomConfig.wheelFactor : cfg.zoomConfig.wheelFactor;
        const oldScale = scale;
        scale = scale * delta;

        const worldX = (e.clientX - translateX) / oldScale;
        const worldY = (e.clientY - translateY) / oldScale;

        translateX = e.clientX - worldX * scale;
        translateY = e.clientY - worldY * scale;
        updateTransform();
    });

    $('#modal-close').on('click', closeModal);
    $('#modal-overlay').on('click', function(e) {
        if (e.target === this) closeModal();
    });
    $('#submit-comment').on('click', addComment);

    // 从 API 加载数据并初始化花草
    async function loadGardenData() {
        try {
            // 获取所有评论
            AllCommData = await getData("getallcomment");
            
            // 获取所有记录
            var data = await getData("getallrecords");
            
            if (data && data.length > 0) {
                console.log('成功加载 API 数据，共' + data.length + '条记录');
                data.forEach(function(record, index) {
                    const imageIndex = randInt(0, cfg.plantImages.length - 1);
                    const plant = {
                        id: currentPlantId++,
                        recordId: record.id || record.rid,
                        imageIndex: imageIndex,
                        image: cfg.plantImages[imageIndex],
                        userImage: record.picture || '',
                        userContent: (!record.picture || record.picture.trim() === '') && record.content ? (record.content.length > 8 ? record.content.substring(0, 8) + '...' : record.content) : '',
                        userName: record.name || record.gname || '',
                        x: rand(200, cfg.worldSize.width - 200),
                        y: rand(200, cfg.worldSize.height - 200),
                        likes: record.likes || 0,
                        comments: [],
                        isNew: false // 从 API 来的花草，不能切换
                    };
                    
                    // 从 AllCommData 中获取该记录的评论
                    if (AllCommData && AllCommData.length > 0) {
                        var recordComments = filterData(AllCommData, plant.recordId);
                        if (recordComments && recordComments.length > 0) {
                            recordComments.forEach(function(comment) {
                                plant.comments.push({
                                    user: comment.name || '匿名用户',
                                    text: comment.comment || '',
                                    cdate: comment.Cdate || new Date().toISOString()
                                });
                            });
                        }
                    }
                    
                    // 如果有评论数但没有具体评论，添加一些模拟评论
                    if (record.comments > 0 && plant.comments.length === 0) {
                        for (let j = 0; j < record.comments; j++) {
                            plant.comments.push({
                                user: cfg.userNames[randInt(0, cfg.userNames.length - 1)],
                                text: cfg.uiConfig.sampleComments[randInt(0, cfg.uiConfig.sampleComments.length - 1)]
                            });
                        }
                    }
                    
                    plants.push(plant);
                    renderPlant(plant);
                });
            } else {
                console.log('使用默认花草');
                initDefaultPlants();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            console.log('使用默认花草');
            initDefaultPlants();
        }
    }
    
    function initDefaultPlants() {
        for (let i = 0; i < cfg.plantConfig.initialCount; i++) {
            const imageIndex = randInt(0, cfg.plantImages.length - 1);
            const plant = {
                id: currentPlantId++,
                imageIndex: imageIndex,
                image: cfg.plantImages[imageIndex],
                userImage: 'img/A' + (randInt(1, 30)) + '.png',
                userContent: '',
                x: rand(200, cfg.worldSize.width - 200),
                y: rand(200, cfg.worldSize.height - 200),
                comments: [],
                isNew: false // 默认花草，不能切换
            };
            plants.push(plant);
            renderPlant(plant);
        }
    }
    
    // 执行加载
    loadGardenData();

    spawnMultipleButterflies();
    spawnMultipleBees();
    createFireflies();

    // 默认放大 3 倍并随机设置初始位置
    scale = 3;
    
    // 计算平移范围，确保花园在屏幕内
    const worldWidth = cfg.worldSize.width;
    const worldHeight = cfg.worldSize.height;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // 计算缩放后的世界尺寸
    const worldScaledWidth = worldWidth * scale;
    const worldScaledHeight = worldHeight * scale;
    
    // 计算平移范围
    const minTranslateX = containerWidth - worldScaledWidth;
    const minTranslateY = containerHeight - worldScaledHeight;
    
    // 随机设置初始位置，确保在有效范围内
    translateX = rand(minTranslateX, 0);
    translateY = rand(minTranslateY, 0);
    
    updateTransform();
    
    // 显示花园
    $('#garden-world').css('visibility', 'visible');
}