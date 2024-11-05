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

/*
card_type 
317 		今日错过
101 17 		微博热搜
118 		轮播
19  		快捷功能
101 236  	微博趋势
*/

// ------------------ 函数定义 ------------------

// 删除广告
function RemoveAds(array = []) {
    for (let i = array.length - 1; i >= 0; i--) {
        const item = array[i];
        const isSearchAd =
            ["hot_ad", "trend"].includes(item?.item_category) ||
            item?.data?.mblogtypename === "广告" ||
            item?.data?.ad_state === 1 ||
            item?.itemId === "INTEREST_PEOPLE";

        if (isSearchAd) {
            array.splice(i, 1);
        }
    }
    // console.log("页面广告已过滤 o(*￣▽￣*)ブ")
}

// 删除发现页的卡片类型
function RemoveCardtype(array = []) {
    for (let i = array.length - 1; i >= 0; i--) {
        const item = array[i];
        if (
            item?.category === 'card' &&
            ([118, 19, 101, 236].includes(item?.data?.card_type) && !(item?.data?.card_type === 101 && item?.data?.scheme === ""))
        ) {
            array.splice(i, 1);
        }
    }
    // console.log("多余模块已剔除 o(*￣▽￣*)ブ")
}

// 递归处理嵌套的 items
function processItems(el) {
    if (Array.isArray(el?.items)) {
        RemoveAds(el.items);
        RemoveCardtype(el.items);
        el.items.forEach(item => processItems(item));
    }
}

// ------------------ 处理响应 ------------------

if (url.includes("comments/build_comments")) {
    if (obj.datas) {
        obj.datas = obj.datas.filter(item => !item.adType);
    }
}

else if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
    // 删除不需要的字段
    deleteFields(obj, ['head_cards', 'trend', 'snapshot_share_customize_dic', 'dynamic_share_items', 'report_data', 'loyal_fans_guide_info', 'top_cards']);
}

else if (url.includes("search/finder")) {
    const channels = obj?.channelInfo?.channels;
    if (channels && channels.length > 0) {
        const payload = channels[0]?.payload;
        if (payload) {
            deleteFields(payload.loadedInfo, ['headerBack', 'searchBarContent']);
            processItems(payload);  // 递归处理最外层和嵌套的 items
        }
    }
}

else if (url.includes("search/container_timeline")) {
    if (obj?.loadedInfo) {
        deleteFields(obj.loadedInfo, ['headerBack', 'searchBarContent']);
    }
    processItems(obj);  // 递归处理最外层和嵌套的 items
}

else if (url.includes("/2/searchall?")) {
    RemoveAds(obj.items);
}

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
    RemoveAds(obj.items);
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
    obj.messages = obj.messages.filter(message => message.isInsert !== false && message.ad_tag?.text !== '广告');
}

// 删除指定属性
function deleteFields(obj, fields) {
    fields.forEach(field => {
        if (obj && obj.hasOwnProperty(field)) {
            delete obj[field];
        }
    });
}

// ------------------ 返回处理结果 ------------------
$done({ body: JSON.stringify(obj) });
