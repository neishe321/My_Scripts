const url = $request.url;
let obj = JSON.parse($response.body);
if (url.includes("/movie/index_recommend")) {
    obj.data = obj?.data?.filter(item => item.layout !== "advert_self");

    obj.data?.forEach(item => {
        item.list = item.list?.filter(subItem => subItem.type !== 3);
    });
}
$done({ body: JSON.stringify(obj) });
