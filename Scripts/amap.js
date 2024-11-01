const obj = JSON.parse($response.body);
const url = $request.url;

if (url.includes("ws/promotion-web/resource")) {
	// 打车
    ["icon", "banner", "tips", "popup", "bubble", "other"].forEach(el => obj.data?.[el] && (obj.data[el] = []));
} 
else if (url.includes("profile/index/node")) {
	// 我的
    delete obj.data?.tipData;
    obj.data?.cardList && (obj.data.cardList = Object.values(obj.data.cardList).filter(
        a => ["MyOrderCard", "GdRecommendCard"].includes(a.dataType)
    ));
}
else if ( - 1 != $request.url.indexOf("search/nearbyrec_smart")){
	// 附近
	obj.data.modules && obj.data.modules= {};
}
$done({ body: JSON.stringify(obj) });
