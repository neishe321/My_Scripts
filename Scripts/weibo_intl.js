// 函数映射
const otherUrls = {
    "user_center": modifiedUserCenter, // 用户中心
    "php?a=open_app": removeAdBanner,  // 帖子下方广告banner
    "a=trends": removeTopics,          // 趋势页
    "a=get_coopen_ads": removeIntlOpenAds, // 开屏广告
    "interface/sdk/sdkad.php": removePhpScreenAds, // SDK广告
    "php?a=search_topic": removeSearchTopic // 搜索话题
};

// 获取处理函数
function getModifyMethod(url) {
    for (let key in otherUrls) {
        if (url.includes(key)) {
            return otherUrls[key]; 
        }
    }
    return null; 
}

// 实现函数
function removeAdBanner(e) {
    if (e.data) {
        if (e.data.close_ad_setting) delete e.data.close_ad_setting;
        if (e.data.detail_banner_ad) e.data.detail_banner_ad = [];
    }
    return e;
}

function modifiedUserCenter(e) {
    if (e.data && e.data.cards) {
        e.data.cards = e.data.cards.filter(card => {
            return card.items && card.items.length > 0 && 
                   card.items[0].type !== "personal_vip" &&
                   card.items[0].type !== "ic_profile_wallpaper"; 
        });
    }
    return e;
}


function removeTopics(e) {
    if (e.data) {
        e.data.order = ["discover", "search_topic"];
        if (Array.isArray(e.data.discover)) {
            e.data.discover.splice(0, 1);
        }
    }
    return e;
}

function removeIntlOpenAds(e) {
    if (e.data) {
        e.data = { display_ad: 1 };
    }
    return e;
}

function removePhpScreenAds(e) {
    if (!e.ads) return e;
    e.show_push_splash_ad = false;
    e.background_delay_display_time = 0;
    e.lastAdShow_delay_display_time = 0;
    e.realtime_ad_video_stall_time = 0;
    e.realtime_ad_timeout_duration = 0;

    for (let t of e.ads) {
        t.displaytime = 0;
        t.displayintervel = 86400;
        t.allowdaydisplaynum = 0;
        t.displaynum = 0;
        t.displaytime = 1;
        t.begintime = "2029-12-30 00:00:00";
        t.endtime = "2029-12-30 23:59:59";
    }
    return e;
}

function removeSearchTopic(e) {
    if (e.data && e.data.search_topic && e.data.search_topic.cards.length > 0) {
        e.data.search_topic.cards = Object.values(e.data.search_topic.cards).filter(e => e.type !== "searchtop");
        if (e.data.trending_topic) delete e.data.trending_topic;
    }
    return e;
}

// 主函数
var body = $response.body;
var url = $request.url;
let modifyFunction = getModifyMethod(url); 

if (modifyFunction) {
    console.log(modifyFunction.name);
    let data = JSON.parse(body.match(/\{.*\}/)[0]); 
    modifyFunction(data); 
    body = JSON.stringify(data); 
    if (modifyFunction === removePhpScreenAds) {
        body = JSON.stringify(data) + "OK";
    }
}

$done({ body });
