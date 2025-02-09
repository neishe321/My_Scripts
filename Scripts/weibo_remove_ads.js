// 拦截请求 URL
let url = $request.url;
if (!$response.body) {
  $done({});
}
let obj = JSON.parse($response.body);

// ------------------ 数据清理函数 ------------------

// 清理用户信息
function cleanUserData(user) {
  if (!user) return;
  ["icons", "avatar_extend_info", "mbtype", "mbrank", "level"].forEach(key => delete user[key]);
}

// 清理评论项气泡
function cleanCommentItem(item) {
  if (!item) return;
  ["comment_bubble", "vip_button"].forEach(key => delete item[key]);
}

// 处理评论区，移除广告和无关内容
function removeComments(comments = []) {
  return comments.filter(item => {
    // 直接过滤广告
    if (item.adType) return false; 

    cleanCommentItem(item);
    cleanUserData(item.user);

    if (item.data) {
      cleanCommentItem(item.data);
      cleanUserData(item.data.user);
    }

    if (Array.isArray(item.comments)) {
      item.comments = removeComments(item.comments);
    }
    return true;
  });
}

// 处理嵌套的 items 数组，递归移除广告和无用模块
function processItems(array = []) {
  const groupItemIds = new Set([
    "card86_card11_cishi", "card86_card11", "INTEREST_PEOPLE",
    "trend_top_qiehuan", "profile_collection", "realtime_tag_groug"
  ]);

  const cardItemIds = new Set([
    "finder_channel", "finder_window", "tongcheng_usertagwords"
  ]);

  const keywords = [
    "hot_character", "local_hot_band", "hot_video", "hot_chaohua_list", "hot_link_mike",
    "chaohua_discovery_banner", "bottom", "hot_search"
  ];

  return array.filter(item => {
    // 清理数据对象
    if (item?.data) {
      ["semantic_brand_params", "common_struct", "ad_tag_nature", "tag_struct", "pic_bg_new", "buttons", "extra_button_info"]
        .forEach(key => delete item.data[key]);
      cleanUserData(item.data.user);

      // 清除超话搜索框提示文字，但保留框架
      if (item.data.hotwords && item.data.itemid === "sg_bottom_tab_search_input") {
        delete item.data.hotwords;
      }
    }

    // 过滤广告和无用模块
    if (
      item?.item_category === "hot_ad" ||
      item?.data?.mblogtypename === "广告" ||
      item?.mblogtypename === "广告" ||
      item?.data?.ad_state === 1 ||
      item?.isInsert === false ||
      item?.data?.card_type === 196 ||
      (item?.category === "group" && groupItemIds.has(item?.itemId)) ||
      (item?.category === "card" && cardItemIds.has(item?.data?.itemid)) ||
      (item?.itemId && keywords.some(keyword => item.itemId.includes(keyword))) ||
      (item?.data?.itemid && keywords.some(keyword => item.data.itemid.includes(keyword)) && item.data.itemid !== "sg_bottom_tab_search_input") ||
      item?.data?.wboxParam || item?.arrayText?.contents ||
      item?.data?.title === "大家都在问" || item?.data?.desc === "相关搜索" ||
      (item?.data?.group && item?.data?.anchorId) ||
      item?.data?.card_ad_style === '1' || item?.data?.card_id === "search_card"
    ) {
      return false;
    }

    // 递归处理嵌套 items
    if (Array.isArray(item.items)) {
      item.items = processItems(item.items);
    }

    return true;
  });
}

// ------------------ 处理不同 API 的响应 ------------------

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
  if (Array.isArray(obj.datas)) obj.datas = removeComments(obj.datas);
  if (Array.isArray(obj.root_comments)) obj.root_comments = removeComments(obj.root_comments);
  if (obj?.rootComment) {
    cleanCommentItem(obj.rootComment);
    cleanUserData(obj.rootComment.user);
  }
  if (obj?.comments && Array.isArray(obj.comments)) {
    obj.comments = removeComments(obj.comments);
  }
} 

else if (url.includes("statuses/repost_timeline")) {
  obj.reposts = processItems(obj.reposts);
} 

else if (url.includes("search/finder")) {
  if (obj?.header?.data?.items && Array.isArray(obj.header.data.items)) {
    obj.header.data.items = processItems(obj.header.data.items);
  }

  if (obj?.channelInfo) {
    delete obj.channelInfo.moreChannels;
  }

  if (Array.isArray(obj?.channelInfo?.channels)) {
    obj.channelInfo.channels = obj.channelInfo.channels.slice(0, 2);
  }

  if (Array.isArray(obj?.channelInfo?.channels)) {
    for (const channel of obj.channelInfo.channels) {
      if (channel?.payload?.loadedInfo?.searchBarContent) {
        delete channel.payload.loadedInfo.searchBarContent; 
      }
      if (Array.isArray(channel?.payload?.items)) {
        channel.payload.items = processItems(channel.payload.items);
      }
    }
  }
}

else if (url.includes("search/container_discover")) {
  if (obj.loadedInfo) {
    delete obj.loadedInfo?.searchBarContent;
  }
  obj.items = processItems(obj.items);
}

else if (url.includes("/flowlist")) {
  obj.items = processItems(obj.items);
}

else if (url.includes("/searchall")) {
  obj.items = processItems(obj.items);
} 

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
  if (obj?.loadedInfo) { delete obj.loadedInfo.headers; }
  obj.items = processItems(obj.items);
} 

else if (url.includes("/messageflow/notice")) {
  obj.messages = processItems(obj.messages);
}

$done({ body: JSON.stringify(obj) });
