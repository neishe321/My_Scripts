let obj = JSON.parse($response.body);

if ($request.url.indexOf("/movie/index_recommend") !== -1) {
    obj.data = obj?.data?.filter(item => item.layout !== "advert_self");
    obj.data?.forEach(item => {
        item.list = item.list?.filter(subItem => subItem.type !== 3);
    });
}
$done({ body: JSON.stringify(obj) });
