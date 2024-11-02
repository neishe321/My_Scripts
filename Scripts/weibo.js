let body = $response.body;
let url = $request.url;
let obj = JSON.parse(body);

if (url.includes("comments/build_comments") && obj.datas) {
    console.log("去除评论推广");
    obj.datas = obj.datas.filter(item => !item.adType);
} else if (url.includes("guest/statuses_extend")) {
    console.log("去除帖子推广");
    delete obj.head_cards;
    delete obj.trend;
    delete obj.snapshot_share_customize_dic;
    delete obj.dynamic_share_items;
    delete obj.report_data;

    // obj.head_cards = obj.head_cards.filter(card => card.actionlog?.source !== "ad");
}

$done({ body: JSON.stringify(obj) });
