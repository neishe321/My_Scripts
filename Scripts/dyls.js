let obj = JSON.parse($response.body);

if (Array.isArray(obj?.data)) {
    obj.data = obj.data.filter(item => item.layout !== "advert_self");
    obj.data.forEach(item => {
        if (Array.isArray(item.list)) {
            item.list = item.list.filter(subItem => subItem.type !== 3);
        }
    });
};

$done({body:JSON.stringify(obj)});
