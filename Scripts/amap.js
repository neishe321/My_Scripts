const obj = JSON.parse($response.body);
const url = $request.url;

if (url.indexOf("c3frontend/af-nearby/nearby") !== -1) {
    // 附近
    obj.data?.modules && (obj.data.modules = {});
}
else if (url.indexOf("ws/promotion-web/resource") !== -1) {
    // 打车
    ["icon", "banner", "tips", "popup", "bubble", "other"].forEach(el => obj.data?.[el] && (obj.data[el] = []));
} 
else if (url.indexOf("profile/index/node") !== -1) {
    // 我的
    delete obj.data?.tipData;
    obj.data?.cardList && (obj.data.cardList = Object.values(obj.data.cardList).filter(
        a => ["MyOrderCard", "GdRecommendCard"].includes(a.dataType)));
}

$done({ body: JSON.stringify(obj) });
