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
    delete user.avatar_extend_info; // 头像挂件
    delete user.mbtype;
    delete user.mbrank;
    delete user.level;
  }
}

// 清理评论气泡
function CleanCommentItem(item) {
  if (!item) return;
  delete item.comment_bubble;
  delete item.vip_button;   // 评论气泡
  CleanUserData(item.user); // 去除用户标签
}

// 处理评论区
function RemoveComment(array = []) {
  array.forEach((item, index) => {
    if (!item) return;
    
    // 移除广告
    if (item.adType) {
      array.splice(index, 1);
      return;
    }

    // 清理当前对象的 data 和自身
    if (item.data) CleanCommentItem(item.data);
    CleanCommentItem(item);

    // 递归处理嵌套的评论
    if (Array.isArray(item.comments)) {
      item.comments.forEach(CleanCommentItem);
    }
  });
}

// 去除广告项
function RemoveAds(array = []) {
  if (!Array.isArray(array)) return;
  array = array.filter(item => {
    if (!item?.data) return true;

    const data = item.data;
    delete data.semantic_brand_params;
    delete data.common_struct;
    delete data.ad_tag_nature;
    delete data.tag_struct;
    delete data.pic_bg_new; // 卡片背景
    delete data.buttons; // 关注按钮1
    delete data.extra_button_info; // 关注按钮2
    CleanUserData(data.user); // 用户信息

    // 判断是否是广告
    return !(
      item?.item_category === "hot_ad" ||
      (item?.item_category === "trend" && item?.data?.card_type !== 101) ||
      item?.data?.mblogtypename === "广告" ||
      item?.mblogtypename === "广告" ||
      item?.data?.ad_state === 1 ||
      item?.isInsert === false || // 消息动态推广
      item?.data?.card_type === 22 || // 不记得了
      item?.data?.cate_id === "1114" || // 特定 cate_id
      item?.data?.promotion?.adtype === 1 || // 发现页热搜下方轮播
      item?.data?.card_type === 264 && item?.data?.is_shrink === 1 || // 发现页热搜下方缩小推广
      item?.data?.card_type === 196 // 亚运会奖牌
    );
  });
}

// 处理嵌套的 items 数组
function ProcessItems(array = []) {
  if (!Array.isArray(array)) return;
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
  // 帖子详情
  ["head_cards", "trend", "snapshot_share_customize_dic", "dynamic_share_items", "report_data", "loyal_fans_guide_info", "top_cards", "reward_info", "follow_data", "comment_data"]
    .forEach(key => delete obj[key]);
} 

else if (url.includes("comments/build_comments")) {
  // 评论区处理
  ["datas", "root_comments", "comments"].forEach(key => {
    if (Array.isArray(obj[key])) RemoveComment(obj[key]);
  });

  if (obj?.rootComment) {
    delete obj.rootComment.comment_bubble;
    delete obj.rootComment.vip_button;
    CleanUserData(obj.rootComment.user);
  }
} 

else if (url.includes("statuses/repost_timeline")) {
  RemoveAds(obj.reposts);
} 

else if (url.includes("search/finder")) {
  // 处理头部数据
  const data = obj?.header?.data;
  if (Array.isArray(data?.items)) {
    ProcessItems(data.items);
  }

  // 处理频道信息
  if (obj?.channelInfo) {
    delete obj.channelInfo.moreChannels;
    if (Array.isArray(obj.channelInfo.channels)) {
      obj.channelInfo.channels = obj.channelInfo.channels.slice(0, 2);
      obj.channelInfo.channels.forEach(channel => {
        if (Array.isArray(channel?.payload?.items)) {
          ProcessItems(channel.payload.items);
        }
      });
    }
  }
} 

else if (url.includes("/flowlist")) {
  ProcessItems(obj.items);
} 

else if (url.includes("/2/searchall")) {
  ProcessItems(obj.items);
} 

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
  if (obj?.loadedInfo) {
    delete obj.loadedInfo.headers;
  }
  ProcessItems(obj.items);
} 

else if (url.includes("/messageflow/notice")) {
  RemoveAds(obj.messages);
}

$done({ body: JSON.stringify(obj) });
