const obj = JSON.parse($response.body);
const url = $request.url;

const nearbyModules = ["banner", "contentPoster", "feedRec"];
// const rideModules = ["banner", "other", "bubble", "popup", "push"];
const taxiModules = ["taxi"];

if (url.includes("c3frontend/af-nearby/nearby")) {
    // 附近
    nearbyModules.forEach(key => delete obj.data?.modules?.[key]);
} 
else if (url.includes("ws/promotion-web/resource")) {
    // 打车
    // rideModules.forEach(key => delete obj.data?.[key]);
    obj.data = {};
} 
else if (url.includes("ws/shield/frogserver/aocs/updatable")) {
    // 打车卡片
    taxiModules.forEach(key => delete obj.data?.[key]);
} 
else if (url.includes("profile/index/node")) {
    // 我的
    delete obj.data?.tipData; 
    if (Array.isArray(obj.data?.cardList)) {
        obj.data.cardList = Object.values(obj.data.cardList).filter(a => 
            ["MyOrderCard", "GdRecommendCard"].includes(a.dataType)
        );
    }
} 
else if (url.includes("valueadded/alimama/splash_screen")) {
    // 开屏
    if (Array.isArray(obj.data?.ad)) {
        obj.data.ad.forEach(ad => {
            ad.set.setting.display_time = 0;
            ad.creative[0].start_time = 2240150400;
            ad.creative[0].end_time = 2240150400;
        });
    }
}

$done({ body: JSON.stringify(obj) });
