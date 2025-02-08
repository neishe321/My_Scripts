let url = $request.url;
if (!$response.body) {
  $done({});
}
let obj = JSON.parse($response.body);
  

// ------------------ 函数定义 -----------------

// 清理用户信息
function cleanUserData(user) {
  if (user) {
    delete user.icons;
    delete user.avatar_extend_info;  // 头像挂件
    delete user.mbtype;
    delete user.mbrank;
    delete user.level;
  }
}

// 清理评论项
function cleanCommentItem(item) {
  if (!item) return;
  delete item.comment_bubble;
  delete item.vip_button;
  cleanUserData(item.user);
}

// 处理评论区
function RemoveComment(array = []) {
  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i];

    // 移除广告
    if (item.adType) {
      array.splice(i, 1);
      continue;
    }

    // 清理当前对象的 data 和自身
    if (item.data) cleanCommentItem(item.data);
    cleanCommentItem(item);

    // 递归处理嵌套的评论
    if (Array.isArray(item.comments)) {
      item.comments.forEach(cleanCommentItem);
    }
  }
}

// 去除广告
function RemoveAds(array = []) {
    let result = [];
    
    for (let i = 0; i < array.length; i++) {
        const item = array[i];

        if (item?.data) {
            // 删除不必要的字段
            const data = item.data;
            delete data.semantic_brand_params;
            delete data.common_struct;
            delete data.ad_tag_nature;
            delete data.tag_struct;
            delete data.pic_bg_new;  // 卡片背景
            delete data.buttons;     // 关注按钮1
            delete data.extra_button_info; // 关注按钮2
            cleanUserData(data.user); // 用户信息清理
        }

        // 判断是否是广告
        const isSearchAd = 
            item?.item_category === "hot_ad" ||
            (item?.item_category === "trend" && item?.data?.card_type !== 101) ||
            item?.data?.mblogtypename === "广告" || // item.data 下的 mblogtypename
            item?.mblogtypename === "广告" || // item 本身的 mblogtypename
            item?.data?.ad_state === 1 ||
            item?.isInsert === false ||         // 消息动态推广
            item?.data?.card_type === 22 ||     // 不记得了
            item?.data?.cate_id === "1114" ||   // 特定 cate_id
            item?.data?.promotion?.adtype === 1 || // 发现页热搜下方轮播
            item?.data?.card_type === 264 && item?.data?.is_shrink === 1 || // 发现页热搜下方缩小推广
            item?.data?.card_type === 196; // 亚运会奖牌

        if (!isSearchAd) {
            result.push(item);
        }
    }

    // 更新原数组
    array.length = 0;
    if (result.length > 0) {
        array.push(...result);
    }
}

// 移除模块
function RemoveCardtype(array = []) {
    const group_itemId = new Set([
        "card86_card11_cishi", 
        "card86_card11", 
        "INTEREST_PEOPLE",
        "trend_top_qiehuan",
        "profile_collection",         // 那年今日/近期热门
        "realtime_tag_groug",         // 实时近期分享
    ]);
    
    const card_itemid = new Set([
        "finder_channel",             // 发现功能分类
        "finder_window",              // 发现轮播广告
        "tongcheng_usertagwords",     // 实时近期分享标签
    ]);

    const keywords = new Set([
        "hot_character", 
        "local_hot_band", 
        "hot_video", 
        "hot_chaohua_list", 
        "hot_link_mike",
        "chaohua_discovery_banner",
        "bottom",
        "hot_search",                 // 发现页置顶提示 错过等
    ]);

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
            (item?.category === "group" && group_itemId.has(item?.itemId)) ||
            
            // 分类为 card 且 data.itemid 包含在 card_itemid 中
            (item?.category === "card" && card_itemid.has(item?.data?.itemid)) ||
            
            // itemId|data.itemid 中包含 keywords 关键词
            (item?.itemId && keywords.has(item.itemId)) ||
            (item?.data?.itemid && keywords.has(item.data.itemid) && item.data.itemid !== "sg_bottom_tab_search_input") ||
            
            // 其他特定属性判断
            item?.data?.wboxParam ||                      // 含有 wboxParam，可能是趋势相关的标记
            item?.arrayText?.contents ||                  // 智搜总结内容
            item?.data?.title === "大家都在问" ||          // 特定标题
            item?.data?.desc === "相关搜索" ||             // 特定描述
            (item?.data?.group && item?.data?.anchorId) ||// 相关搜索内容
            item?.data?.card_ad_style === '1' ||          // 实时图片推广
            item?.data?.card_id === "search_card";        // 推荐实时搜索框

        if (!shouldRemove) {
            result.push(item);
        }
    }

    // 更新原数组
    array.length = 0;
    if (result.length > 0) {
        array.push(...result);
    }
}

// 处理嵌套的 items数组
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
  // 帖子详情
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
} else if (url.includes("comments/build_comments")) {
  // 评论区处理
  if (Array.isArray(obj.datas)) RemoveComment(obj.datas);
  if (Array.isArray(obj.root_comments)) RemoveComment(obj.root_comments);
  if (obj?.rootComment) {
    // 父评论
    delete obj.rootComment.comment_bubble;
    delete obj.rootComment.vip_button;
    cleanUserData(obj.rootComment.user);
  }
  if (obj?.comments && Array.isArray(obj.comments)) {
    RemoveComment(obj.comments);
  }
} else if (url.includes("statuses/repost_timeline")) {
  RemoveAds(obj.reposts);  // 某种帖子评论广告
} else if (url.includes("search/finder")) {
  const channels = obj?.channelInfo?.channels;

  if (Array.isArray(channels) && channels.length > 0) {
    // 发现页去除趋势和榜单
    channels.splice(1);
    delete channels[0]?.title;

    const params = channels[0]?.params;
    if (params && typeof params === "object") {
      for (const key in params) {
        if (Object.hasOwn(params, key) && typeof params[key] === "number") {
          params[key] = 0;
        }
      }
    }

    const payload = channels[0]?.payload;
    if (payload && typeof payload === "object") {
      delete payload.loadedInfo?.headerBack;
      delete payload.loadedInfo?.searchBarContent;

      if (Array.isArray(payload.items)) {
        ProcessItems(payload.items);
      }
    }
  }
} else if (url.includes("search/container_timeline") || url.includes("search/container_discover")) {
  // 发现页刷新
  if (obj?.loadedInfo) {
    delete obj.loadedInfo.headerBack;
    delete obj.loadedInfo.searchBarContent;
  }
  ProcessItems(obj.items);
} else if (url.includes("/2/searchall?")) {
  // 搜索结果
  ProcessItems(obj.items);
} else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
  // 推荐 & 超话
  if (obj?.loadedInfo) {
    delete obj.loadedInfo.headers;
  }
  ProcessItems(obj.items);
} else if (url.includes("/messageflow/notice")) {
  RemoveAds(obj.messages);
}

$done({ body: JSON.stringify(obj) });
