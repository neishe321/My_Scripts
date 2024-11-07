let body = $response.body;
let url = $request.url;
let obj;

try {
    obj = JSON.parse(body);
} catch (e) {
    console.error("JSON 解析错误:", e);
    $done({ body });
    return;
}

// ------------------ 函数定义 ------------------

// 删除属性
function deleteFields(obj, fields) {
    fields.forEach(field => {
        if (obj && obj.hasOwnProperty(field)) {
            delete obj[field];
        }
    });
}

// 移除广告
function RemoveAds(array = []) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const isSearchAd =
            ["hot_ad", "trend"].includes(item?.item_category) ||
            item?.data?.mblogtypename === "广告" ||
            item?.data?.ad_state === 1 ||
	    item?.isInsert == false && item?.msg_card?.ad_tag?.text == '广告'; // 消息动态推广

        if (!isSearchAd) {
            result.push(item);
        }
    }   
    array.length = 0;
    array.push(...result);
}

// 移除模块
function RemoveCardtype(array = []) {
    const group_itemId = [
        "card86_card11_cishi", 
        "card86_card11", 
        "INTEREST_PEOPLE", 
        "profile_collection",			 // 那年今日/近期热门
	"realtime_tag_groug",			 // 实时近期分享
    ];
    
    const card_itemid = [
        "finder_channel",  			// 发现功能分类
        "finder_window",   			// 发现轮播广告
	"tongcheng_usertagwords",		// 实时近期分享标签
    ];

    const hot_card_keywords = [
		"hot_character", 
		"local_hot_band", 
		"hot_video", 
		"hot_chaohua_list", 
		"hot_link_mike",
		"chaohua_discovery_banner",
		"bottom"
    ];

    let result = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
	// 推荐实时搜索框文本
	if (item?.data?.card_id === "search_card") {delete item?.data?.desc} 
	// 超话搜索框提示文字
	if (item?.data?.hotwords && item?.data?.itemid === "sg_bottom_tab_search_input") {delete item?.data?.hotwords }
        // 其余模块
	const isSearchCard = 
            (item?.category === "group" && group_itemId.includes(item?.itemId)) ||
            (item?.category === "card" && card_itemid.includes(item?.data?.itemid)) ||
            (item?.itemId && hot_card_keywords.some(keyword => item?.itemId.includes(keyword))) ||
            (item?.data?.wboxParam) || 			// wboxParam
            (item?.data?.cate_id === "1114") ||   	// wboxParam.png
	    (item?.data?.card_ad_style === '1') ||  	// 实时图片推广
	    
	    // 下边属于超话卡片
	    (item?.data?.itemid && hot_card_keywords.some(keyword => item?.data.itemid.includes(keyword)) && item?.data?.itemid !== "sg_bottom_tab_search_input") ||
	    (item?.data?.header?.title === "绝美壁纸上新")
	
	if (!isSearchCard) {
		 result.push(item);
        }
    }

    array.length = 0;
    array.push(...result);
}

// 处理嵌套的 items数组
function processItems(array = []) {
    RemoveAds(array);
    RemoveCardtype(array);

    array.forEach(item => {
        if (Array.isArray(item?.items)) {
            processItems(item.items);
        }
    });
}

// ------------------ 处理响应 ------------------

if (url.includes("comments/build_comments")) {
    // 详情
    if (obj.datas) {
        obj.datas = obj.datas.filter(item => !item.adType);
    }
}

else if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
    // 详情
    deleteFields(obj, ['head_cards', 'trend', 'snapshot_share_customize_dic', 'dynamic_share_items', 'report_data', 'loyal_fans_guide_info', 'top_cards']);
}

else if (url.includes("search/finder")) {
    // 首次发现
    const channels = obj?.channelInfo?.channels;
    if (channels && channels.length > 0) {
        const payload = channels[0]?.payload;
        if (payload) {
            deleteFields(payload.loadedInfo, ['headerBack', 'searchBarContent']);
            processItems(payload.items); 
        }
    }
}

else if (url.includes("search/container_timeline") || url.includes("search/container_discover")) {
    // 刷新发现
    if (obj?.loadedInfo) {
        deleteFields(obj.loadedInfo, ['headerBack', 'searchBarContent']);
    }
    processItems(obj.items);
}

else if (url.includes("/2/searchall?")) {
    // 搜索
    processItems(obj.items);
}

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
    // 推荐/超话
    processItems(obj.items);
}

else if (url.includes("/profile/me")) {
    obj.items = obj.items.slice(0, 2);
    if (obj.items.length > 0 && obj.items[0].header) {
        deleteFields(obj.items[0].header, ['vipIcon', 'vipView']);
    }
}

else if (url.includes("aj/appicon/list")) {
    const list = obj.data.list;
    list.forEach(item => {
        item.cardType = "2";
        item.tag = "";
    });
}

else if (url.includes("/messageflow/notice")) {
    RemoveAds(obj.messages)
}


// ------------------ 返回处理结果 ------------------
$done({ body: JSON.stringify(obj) });
