let url = $request.url;
if (!$response.body) {
  $done({});
}
let obj = JSON.parse($response.body);

// ------------------ 数据清理函数 -------------------

// 清理帖子详情广告
function cleanExtend(obj){
  if (!obj) return;
  delete obj.reward_info; // 点赞是美意
  delete obj.head_cards; // 底部广告卡片
  delete obj.report_data; // 举报类型
  delete obj.snapshot_share_customize_dic; // 该博主其他信息
  delete obj.top_cards; // 大家都在搜
  delete obj.comment_data; // 友善评论
  delete obj.dynamic_share_items;
  delete obj.trend; // 好物种草 相关推荐
  delete obj.follow_data;
  delete obj.loyal_fans_guide_info; // 忠诚粉丝指南
  delete obj.topic_struct;
  delete obj.extend_info;
  delete obj.common_struct;
}

// 清理用户信息
function cleanUserData(user) {
  if (!user) return;
  delete user.icons;
  delete user.avatar_extend_info;   // 头像挂件
  delete user.mbtype;
  delete user.mbrank;
  delete user.level;
  delete user.type;
}

// 清理评论项
function cleanCommentItem(item) {
  if (!item) return;
  
  // 气泡 用户标签 背景
  delete item.comment_bubble;
  delete item.vip_button;
  delete item.pic_bg_new
  delete item.pic_bg_new_dark;
  delete item.pic_bg_type;
  cleanUserData(item.user);

  // 递归处理子评论
  const comments = item.comments;
  if (Array.isArray(comments)) {
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i]) cleanCommentItem(comments[i]);
    }
  }
}

// 处理评论区
function removeComments(array = []) {
  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i];

    // 移除广告
    if (item.adType || item.business_type === "hot") {
      array.splice(i, 1);
      continue;
    }

    // 清理当前评论项
    cleanCommentItem(item);
    if (item.data) cleanCommentItem(item.data);
  }
}

// 移除广告和无用模块
function processItems(array = []) {
  if (!Array.isArray(array)) return array;

  const groupItemIds = new Set([
    "card86_card11_cishi", "card86_card11", "INTEREST_PEOPLE",
    "trend_top_qiehuan", "profile_collection", "realtime_tag_groug"
  ]);

  const cardItemIds = new Set([
    "finder_channel", "finder_window", "tongcheng_usertagwords"
  ]);

  const keywords = [
    "hot_character", "local_hot_band", "hot_video", "hot_chaohua_list", "hot_link_mike",
    "chaohua_discovery_banner", "bottom", "hot_search" , "广告"
  ];

  const cleanData = (item) => {
    if (item?.data) {
      ["semantic_brand_params", "common_struct", "ad_tag_nature", "tag_struct", "pic_bg_new","pic_bg_new_dark", "buttons", "extra_button_info"]
        .forEach(key => delete item.data[key]);
      cleanUserData(item.data.user);
      cleanExtend(item.data);
      
      // 清除超话搜索框提示文字，但保留框架
      if (item.data.hotwords && item.data.itemid === "sg_bottom_tab_search_input") {
        delete item.data.hotwords;
      }
    }
  };
  // 循环开始
  for (let i = array.length - 1; i >= 0; i--) {
    let item = array[i];
    
    // 递归处理嵌套 items
    if (Array.isArray(item.items)) {
      processItems(item.items);
    }

    // 过滤广告和无用模块
    if (
      item?.item_category === "hot_ad" ||
      item?.item_category === "trend" ||
      item?.data?.mblogtypename === "广告" ||
      item?.mblogtypename === "广告" ||
      item?.data?.ad_state === 1 ||
      item?.isInsert === false ||
      item?.data?.card_type === 196 ||
      (item?.category === "group" && groupItemIds.has(item?.itemId)) ||
      (item?.category === "card" && cardItemIds.has(item?.data?.itemid)) ||
      (item?.itemId && keywords.some(keyword => item.itemId.includes(keyword))) ||
      (item?.data?.itemid && keywords.some(keyword => item.data.itemid.includes(keyword))) ||
      // item?.data?.title === "大家都在问" || 
      item?.data?.desc === "相关搜索" ||
      (item?.data?.group && item?.data?.anchorId) ||
      item?.data?.card_ad_style === '1' || item?.data?.card_id === "search_card"
    ) {
      array.splice(i, 1);
      continue;
    }
    
    // 清理数据对象
    cleanData(item);
    
    // 递归清理嵌套 items
    if (Array.isArray(item.items)) {
      for (let j = 0; j < item.items.length; j++) {
        cleanData(item.items[j]);
      }
    }
  }
}


// ------------------ 处理不同 API 的响应 ------------------

if (url.includes("guest/statuses_extend") || url.includes("statuses/extend") || url.includes("statuses/show")) {
  // 帖子详情
  if (obj.user) cleanUserData(obj.user);
  cleanExtend(obj);
}

else if (url.includes("comments/build_comments")) {
  // 帖子详情
  if (Array.isArray(obj.datas)) removeComments(obj.datas);
  if (Array.isArray(obj.root_comments)) removeComments(obj.root_comments);
  if (Array.isArray(obj.comments)) removeComments(obj.comments);
  if (obj?.rootComment) cleanCommentItem(obj.rootComment);
  // 超话帖子详情
  if (obj?.status) cleanCommentItem(obj.status);
}

else if (url.includes("statuses/repost_timeline")) {
  // 帖子转发区处理
  if (Array.isArray(obj.reposts)) {
    removeComments(obj.reposts);
    processItems(obj.reposts);
  };
 
  if (Array.isArray(obj.hot_reposts)) {
    removeComments(obj.hot_reposts);
    processItems(obj.hot_reposts);
} 

else if (url.includes("search/finder")) {
  // 
  if (obj?.header?.data?.items && Array.isArray(obj.header.data.items)) processItems(obj.header.data.items);
  // 商城入口
  if (obj?.channelInfo) delete obj.channelInfo.moreChannels;
  // 热点/趋势/榜单
  if (Array.isArray(obj?.channelInfo?.channels)) {
    const allowedKeys = new Set(['discover_channel', 'trends_channel', 'band_channel']);
    obj.channelInfo.channels = obj.channelInfo.channels.filter(channel => allowedKeys.has(channel.key));
}

  //
  if (Array.isArray(obj?.channelInfo?.channels)) {
    for (const channel of obj.channelInfo.channels) {
      if (channel?.payload?.loadedInfo?.searchBarContent) {
        // 热搜关键词
        delete channel.payload.loadedInfo.searchBarContent; 
      }
      if (Array.isArray(channel?.payload?.items)) {
        processItems(channel.payload.items);
      }
    }
  }
}

else if (url.includes("search/container_discover") || url.includes("search/container_timeline") ) {
  // 热搜关键词
  if (obj.loadedInfo) delete obj.loadedInfo?.searchBarContent;
  processItems(obj.items);
}

// else if (url.includes("/flowlist")) {
//   // 热转
//   processItems(obj.items);
// }

else if (url.includes("/searchall")) {
  processItems(obj.items);
} 

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
  if (obj?.loadedInfo) delete obj.loadedInfo.headers;
  processItems(obj.items);
} 

else if (url.includes("/messageflow/notice")) {
  processItems(obj.messages);
}

$done({ body: JSON.stringify(obj) });
