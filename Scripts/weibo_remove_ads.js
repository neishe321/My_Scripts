let obj = JSON.parse($response.body);
let url = $request.url;


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
            item?.item_category === "hot_ad" || 
            (item?.item_category === "trend" && item?.data?.card_type !== 101) ||
            item?.data?.mblogtypename === "广告" ||
            item?.data?.ad_state === 1 ||
            item?.isInsert === false; // 消息动态推广

        if (!isSearchAd) {
            result.push(item);
        }
    }

    if (result.length > 0) {
        array.length = 0;
        array.push(...result);
    }
}

// 移除模块函数
function RemoveCardtype(array = []) {
    const group_itemId = [
        "card86_card11_cishi", 
        "card86_card11", 
        "INTEREST_PEOPLE",
        "trend_top_qiehuan",
        "profile_collection",         // 那年今日/近期热门
        "realtime_tag_groug",         // 实时近期分享
    ];
    
    const card_itemid = [
        "finder_channel",             // 发现功能分类
        "finder_window",              // 发现轮播广告
        "tongcheng_usertagwords",     // 实时近期分享标签
	"new_sg_bottom_tab_discovery",
    ];

    const keywords = [
        "hot_character", 
        "local_hot_band", 
        "hot_video", 
        "hot_chaohua_list", 
        "hot_link_mike",
        "chaohua_discovery_banner",
        "bottom",
        "hot_search",                 // 发现页置顶提示 错过等
    ];

    let result = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        
        // 清除超话搜索框提示文字，但保留框架
        if (item?.data?.hotwords && item?.data?.itemid === "sg_bottom_tab_search_input") {
            delete item.data.hotwords;
        }
        
        // 判断是否需要移除该项
        const shouldRemove = 
            // 分类为 group 且 itemId 包含在 group_itemId 中
            (item?.category === "group" && group_itemId.includes(item?.itemId)) ||
            
            // 分类为 card 且 data.itemid 包含在 card_itemid 中
            (item?.category === "card" && card_itemid.includes(item?.data?.itemid)) ||
            
            // itemId 中包含 keywords 关键词
            (item?.itemId && keywords.some(keyword => item.itemId.includes(keyword))) ||
            
            // data.itemid 包含 keywords，且不等于 "sg_bottom_tab_search_input"
            (item?.data?.itemid && keywords.some(keyword => item.data.itemid.includes(keyword)) && item.data.itemid !== "sg_bottom_tab_search_input") ||
            
            // 其他特定属性判断
            item?.data?.wboxParam ||                      // 含有 wboxParam，可能是趋势相关的标记
            item?.data?.cate_id === "1114" ||             // 特定 cate_id
            item?.arrayText?.contents ||                  // 智搜总结内容
            item?.data?.title === "大家都在问" ||          // 特定标题
            item?.data?.desc === "相关搜索" ||             // 特定描述
            (item?.data?.group && item?.data?.anchorId) ||// 相关搜索内容
            item?.data?.card_ad_style === '1' ||          // 实时图片推广
            item?.data?.card_id === "search_card";        // 推荐实时搜索框

        // 如果不符合移除条件，则保留在结果中
        if (!shouldRemove) {
            result.push(item);
        }
    }

    if (result.length > 0) {
        array.length = 0;
        array.push(...result);
    }
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
    deleteFields(obj, ['head_cards', 
		       'trend', 
		       'snapshot_share_customize_dic', 
		       'dynamic_share_items', 
		       'report_data', 
		       'loyal_fans_guide_info', 
		       'top_cards',
		       'reward_info',
		       'follow_data'
		      ]
		);
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
    if (obj.items.length > 0 && obj.items[1].items) {
       obj.items[1].items = obj.items[1].items.splice(0,4)
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

else if (url.includes("/2/!/huati/discovery_home_bottom_channels")) {
	// 删除超话广场
  if (obj?.button_configs) {
	delete obj.button_configs
  }

  if (obj?.channelInfo?.channel_list && obj.channelInfo.channel_list.length > 1) {
    	delete obj.channelInfo.channel_list[1]
		
  }
}


$done({body:JSON.stringify(obj)});
