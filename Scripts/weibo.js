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
 
// 删除指定属性
function deleteFields(obj, fields) {
    fields.forEach(field => {
        if (obj && obj.hasOwnProperty(field)) {
            delete obj[field];
        }
    });
}

// 删除广告
function RemoveAds(array = []) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const isSearchAd =
            ["hot_ad", "trend"].includes(item?.item_category) ||
            item?.data?.mblogtypename === "广告" ||
            item?.data?.ad_state === 1;

        if (!isSearchAd) {
            result.push(item);
        }
    }
    array.length = 0;
    array.push(...result);
}

function RemoveCardtype(array = []) {
    const exclusionItemIds = [
        "card86_card11_cishi", 
        "card86_card11", 
        "INTEREST_PEOPLE", 
        "profile_collection", // 那年今日/近期热门
        "finder_window"  
    ];

    const hot_card = "seqid:763879878|type:ctg1|pos:-0-0|srid:b98b195147c9401d6e218fd2a30236fb|ext:&cate=1049&module_info=hot_character,local_hot_band,hot_video,hot_chaohua_list,hot_link_mike&qtime=1730770435&mod_src=s_finder&";

    let result = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];

        const isSearchCard = (item?.category === "group" && exclusionItemIds.includes(item?.itemId)) ||
            (item?.category === "card" && item?.data?.itemid === "finder_window") ||
            (item?.itemId === hot_card);

        if (!isSearchCard) {
            result.push(item);
        }
    }

    array.length = 0;
    array.push(...result);
}

// 递归处理嵌套的 items数组
function processItems(array = []) {
    RemoveAds(array);
    RemoveCardtype(array);

    // 递归处理每个 item
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
    // 删除属性
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
    // 推荐
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
    obj.messages = obj.messages.filter(message => message.isInsert !== false && message.ad_tag?.text !== '广告');
}

// ------------------ 返回处理结果 ------------------
$done({ body: JSON.stringify(obj) });
