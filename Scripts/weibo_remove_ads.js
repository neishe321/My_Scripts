let url = $request.url;
if (!$response.body) {
  $done({});
}
let obj = JSON.parse($response.body);

// ------------------ 函数定义 ------------------

// 清理用户信息
function CleanUserData(user) {
  if (user) {
    delete user.icons;
    delete user.avatar_extend_info;  // 头像挂件
    delete user.mbtype;
    delete user.mbrank;
    delete user.level;
  }
}

// 清理评论项气泡
function CleanCommentItem(item) {
  if (!item) return;
  delete item.comment_bubble;
  delete item.vip_button;  // 气泡
  CleanUserData(item.user);
}

// 处理评论区，移除广告和无关内容
function RemoveComment(array = []) {
  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i];

    // 移除广告评论
    if (item.adType) {
      array.splice(i, 1);
      continue;
    }

    // 清理当前对象的 data 和自身
    if (item.data) CleanCommentItem(item.data);
    CleanCommentItem(item);

    // 递归处理嵌套的评论
    if (Array.isArray(item.comments)) {
      item.comments.forEach(CleanCommentItem);
    }
  }
}

// 去除广告项，清理推广信息
function RemoveAds(array = []) {
  let result = [];
  
  for (const item of array) {
    if (item?.data) {
      const data = item.data;
      delete data.semantic_brand_params;
      delete data.common_struct;
      delete data.ad_tag_nature;
      delete data.tag_struct;
      delete data.pic_bg_new;  // 卡片背景
      delete data.buttons;     // 关注按钮1
      delete data.extra_button_info; // 关注按钮2
      CleanUserData(data.user); // 清理用户信息
    }

    // 判断是否是广告
    const isSearchAd = 
        item?.item_category === "hot_ad" ||
        (item?.item_category === "trend" && item?.data?.card_type !== 101) ||
        item?.data?.mblogtypename === "广告" ||
        item?.mblogtypename === "广告" ||
        item?.data?.ad_state === 1 ||
        item?.isInsert === false ||         // 消息动态推广
        item?.data?.card_type === 22 ||     // 未知类别
        item?.data?.cate_id === "1114" ||   // 特定 cate_id
        item?.data?.promotion?.adtype === 1 || // 发现页热搜下方轮播
        item?.data?.card_type === 264 && item?.data?.is_shrink === 1 || // 发现页热搜下方缩小推广
        item?.data?.card_type === 196; // 特定广告样式

    if (!isSearchAd) {
      result.push(item);
    }
  }

  array.length = 0;
  if (result.length > 0) {
    array.push(...result);
  }
}

// 移除不需要的模块
function RemoveCardtype(array = []) {
  const group_itemId = new Set([
    "card86_card11_cishi", 
    "card86_card11", 
    "INTEREST_PEOPLE",
    "trend_top_qiehuan",
    "profile_collection",  // 那年今日/近期热门
    "realtime_tag_groug",  // 实时近期分享
  ]);

  const card_itemid = new Set([
    "finder_channel",      // 发现功能分类
    "finder_window",       // 发现轮播广告
    "tongcheng_usertagwords", // 实时近期分享标签
  ]);

  const keywords = [
    "hot_character", 
    "local_hot_band", 
    "hot_video", 
    "hot_chaohua_list", 
    "hot_link_mike",
    "chaohua_discovery_banner",
    "bottom",      // 超话板块
    "hot_search",  // 发现页置顶提示
  ];

  let result = array.filter(item => {
    // 清除超话搜索框提示文字，但保留框架
    if (item?.data?.hotwords && item?.data?.itemid === "sg_bottom_tab_search_input") {
      delete item.data.hotwords;
    }

    return !(
      (item?.category === "group" && group_itemId.has(item?.itemId)) ||
      (item?.category === "card" && card_itemid.has(item?.data?.itemid)) ||
      (item?.itemId && keywords.some(keyword => item.itemId.includes(keyword))) ||
      (item?.data?.itemid && keywords.some(keyword => item.data.itemid.includes(keyword)) && item.data.itemid !== "sg_bottom_tab_search_input") ||
      item?.data?.wboxParam ||
      item?.arrayText?.contents ||
      item?.data?.title === "大家都在问" ||
      item?.data?.desc === "相关搜索" ||
      (item?.data?.group && item?.data?.anchorId) ||
      item?.data?.card_ad_style === '1' ||
      item?.data?.card_id === "search_card"
    );
  });

  array.length = 0;
  if (result.length > 0) {
    array.push(...result);
  }
}

// 处理嵌套的 items 数组，递归移除广告和无用模块
function ProcessItems(array = []) {
  RemoveAds(array);
  RemoveCardtype(array);

  array.forEach(item => {
    if (Array.isArray(item?.items)) {
      ProcessItems(item.items);
    }
  });
}

// ------------------ 处理响应 ------------------

if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
  delete obj.head_cards;
  delete obj.trend;
  delete obj.snapshot_share_customize_dic;
  delete obj.dynamic_share_items;
  delete obj.report_data;
  delete obj.loyal_fans_guide_info;
  delete obj.top_cards;
  delete obj.reward_info;
  delete obj.follow_data;
  delete obj.comment_data;
} 

else if (url.includes("comments/build_comments")) {
  if (Array.isArray(obj.datas)) RemoveComment(obj.datas);
  if (Array.isArray(obj.root_comments)) RemoveComment(obj.root_comments);
  if (obj?.rootComment) {
    delete obj.rootComment.comment_bubble;
    delete obj.rootComment.vip_button;
    CleanUserData(obj.rootComment.user);
  }
  if (obj?.comments && Array.isArray(obj.comments)) {
    RemoveComment(obj.comments);
  }
} 

else if (url.includes("statuses/repost_timeline")) {
  RemoveAds(obj.reposts);
} 

else if (url.includes("search/finder")) {
  const data = obj?.header?.data;
  if (data?.items && Array.isArray(data.items)) {
    ProcessItems(data.items);
  }

  if (obj?.channelInfo) {
    delete obj.channelInfo.moreChannels;
  }

  if (Array.isArray(obj?.channelInfo?.channels)) {
    obj.channelInfo.channels = obj.channelInfo.channels.slice(0, 2);
  }

  if (Array.isArray(obj?.channelInfo?.channels)) {
    for (const channel of obj.channelInfo.channels) {
      if (Array.isArray(channel?.payload?.items)) {
        ProcessItems(channel.payload.items);
      }
    }
  }
}

else if (url.includes("search/container_discover")) {
  if (obj.loadedInfo) {
    delete obj.loadedInfo?.searchBarContent; // 热搜关键词
  }
  ProcessItems(obj.items)
}

else if (url.includes("/flowlist")) {
  // 热推内容
  ProcessItems(obj.items);
}

else if (url.includes("/2/searchall?")) {
  ProcessItems(obj.items);
} 

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
  if (obj?.loadedInfo) {delete obj.loadedInfo.headers}
  ProcessItems(obj.items);
} 

else if (url.includes("/messageflow/notice")) {
  RemoveAds(obj.messages);
}

$done({ body: JSON.stringify(obj) });
