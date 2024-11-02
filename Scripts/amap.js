const obj = JSON.parse($response.body);
const url = $request.url;

if (url.indexOf("c3frontend/af-nearby/nearby") !== -1) {
    // 附近
    ["banner", "contentPoster", "feedRec"].forEach(key => delete obj.data?.modules?.[key]);
} 
else if (url.indexOf("ws/promotion-web/resource") !== -1) {
    // 打车
    // ["icon", "banner", "tips", "popup", "bubble", "other"].forEach(el => obj.data?.[el] && (obj.data[el] = []));
    obj.data = {};
} 
else if (url.indexOf("profile/index/node") !== -1) {
    // 我的
    delete obj.data?.tipData;
    obj.data?.cardList && (obj.data.cardList = Object.values(obj.data.cardList).filter(
        a => ["MyOrderCard", "GdRecommendCard"].includes(a.dataType)
    ));
} 
else if (url.indexOf("ws/message/notice/list") !== -1) {
    // 角标
    obj.data?.noticeList && (obj.data.noticeList = []);
} 
else if (url.indexOf("valueadded/alimama/splash_screen") !== -1) {
    // 开屏
    if (obj.data?.ad) {
        obj.data.ad.forEach(ad => {
            ad.set.setting.display_time = 0;
            ad.creative[0].start_time = 2240150400;
            ad.creative[0].end_time = 2240150400;
        });
    }
}

$done({ body: JSON.stringify(obj) });
