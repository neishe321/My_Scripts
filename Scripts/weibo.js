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


function RemoveAds(array = []) {
    for (let i = array.length - 1; i >= 0; i--) {
        const isSearchAd = 
            ["hot_ad", "trend"].includes(array[i]?.item_category) ||
            array[i].data?.mblogtypename === "广告" ||
            array[i].data?.ad_state === 1 ||
            array[i].itemId === "INTEREST_PEOPLE";

        if (isSearchAd) {
            array.splice(i, 1);
        }
    };
    console.log("页面广告已过滤 o(*￣▽￣*)ブ")
}


// 发现页模块
function RemoveCardtype(array = []) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].category === 'card' && 
            (
                ([118, 19, 101, 236].includes(array[i].data.card_type) && !(array[i].data.card_type === 101 && array[i].data.scheme == ""))
            )
        ) {
            array.splice(i, 1); 
        }
    };
	console.log("多余模块已过滤 o(*￣▽￣*)ブ")
}



if (url.includes("comments/build_comments")) {
    if (obj.datas) {
        obj.datas = obj.datas.filter(item => !item.adType)
	};
	console.log("多余详情推广已删除 o(*￣▽￣*)ブ")
}

else if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
	delete obj.head_cards;
    delete obj.trend;
    delete obj.snapshot_share_customize_dic;
    delete obj.dynamic_share_items;
    delete obj.report_data;
	delete obj.loyal_fans_guide_info;
	delete obj.top_cards;
    console.log("多余详情卡片已删除 o(*￣▽￣*)ブ")
}

else if (url.includes("search/finder")) {
	// console.log("首次进入发现页");
	obj.channelInfo.channels[0].payload?.loadedInfo?.headerBack && delete obj.channelInfo.channels[0].payload?.loadedInfo?.headerBack;
    RemoveAds(obj.channelInfo.channels[0].payload.items);

	RemoveCardtype(obj.channelInfo.channels[0].payload.items);
	console.log(url.slice(0, 70)) 

}

else if (url.includes("search/container_timeline")) {
	// console.log("已刷新发现页面");
    RemoveAds(obj.items);
	RemoveCardtype(obj.items);
	console.log(url.slice(0, 70))
}


else if (url.includes("/2/searchall?")) {
	RemoveAds(obj.items);
	console.log(url.slice(0, 70))
}

else if (url.includes("/statuses/container_timeline")) {
	RemoveAds(obj.items);
	console.log(url.slice(0, 70))
}

else if (url.includes("profile/container_timeline")) {
	RemoveAds(obj.items);
	console.log(url.slice(0, 70))
}

else if (url.includes("/profile/me")) {
    obj.items = obj.items.slice(0, 2);
    if (obj.items.length > 0 && obj.items[0].header) {
        delete obj.items[0].header.vipIcon;
        delete obj.items[0].header.vipView;
    }
}

else if (url.includes("aj/appicon/list")) {
    obj.data?.list?.forEach(item => {
        item.cardType = "2";
        item.tag = "";
    });
}

else if (url.includes("/messageflow/notice")) {
    obj.messages = obj.messages.filter((message) => {
        return message.isInsert !== false && !(message.ad_tag?.text === '广告');
    });
}

$done({ body: JSON.stringify(obj) });
