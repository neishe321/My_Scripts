const url = $request.url;
let obj = JSON.parse($response.body);

// 定义模块操作
const moduleActions = {
    "c3frontend/af-nearby/nearby": {
        modules: ["banner", "contentPoster", "feedRec"],
        action: (obj, modules) => {
            modules?.forEach(key => delete obj.data?.modules?.[key]);
        }
    },
    "ws/promotion-web/resource": {
        action: (obj) => {
            obj.data = {};
        }
    },
    "ws/shield/frogserver/aocs/updatable": {
        modules: ["taxi"],
        action: (obj, modules) => {
            modules?.forEach(key => delete obj.data?.[key]);
        }
    },
    "profile/index/node": {
        action: (obj) => {
            delete obj.data?.tipData;
            if (Array.isArray(obj.data?.cardList)) {
                obj.data.cardList = Object.values(obj.data.cardList).filter(a => 
                    ["MyOrderCard"].includes(a.dataType)
                );
            }
        }
    },
    "valueadded/alimama/splash_screen": {
        action: (obj) => {
            if (Array.isArray(obj.data?.ad)) {
                obj.data.ad.forEach(ad => {
                    ad.set.setting.display_time = 0;
                    ad.creative[0].start_time = 2240150400;
                    ad.creative[0].end_time = 2240150400;
                });
            }
        }
    }

};


// 执行对应的模块操作
Object.keys(moduleActions).forEach(key => {
    if (url.includes(key)) {
        const action = moduleActions[key];
        action.action(obj, action.modules);
    }
});

$done({ body: JSON.stringify(obj) }); 
