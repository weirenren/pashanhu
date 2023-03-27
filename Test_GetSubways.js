const e = require("express");

var fs = require('fs');

var request = require('request');

const Geohash = require('@geonet/geohash')

const Promise = require('bluebird');
Promise.promisifyAll(request, { suffix: 'SC' });  //suffix 自定义 get --> getSC


let city_pinyin = ''
let city_chinese = ''

const city_subways = {
    city: '北京',
    subways: [
        {
            id: 1,
            name: '1号线',
            station_list: [{ name: '八宝山', latlong: '' }, { name: '苹果园', latlong: '' }]
        }
    ]
}

var beijing_administrative_region_map = [
    {
        name: '东城',
        id: 1
    },
    {
        name: '西城',
        id: 2
    },
    {
        name: '朝阳',
        id: 3
    },
    {
        name: '海淀',
        id: 4
    },
    {
        name: '丰台',
        id: 5
    },
    {
        name: '石景山',
        id: 6
    },
    {
        name: '通州',
        id: 7
    },
    {
        name: '昌平',
        id: 8
    },
    {
        name: '大兴',
        id: 9
    },
    {
        name: '亦庄',
        id: 10
    },
    {
        name: '顺义',
        id: 11
    },
    {
        name: '房山',
        id: 12
    },
    {
        name: '门头沟',
        id: 13
    },
    {
        name: '燕郊',
        id: 18
    }
]

var beijing_subways_map = [
    {
        name: '1号线',
        id: 1
    },
    {
        name: '2号线',
        id: 2
    },
    {
        name: '4号线',
        id: 3
    },
    {
        name: '5号线',
        id: 4
    },
    {
        name: '6号线',
        id: 5
    },
    {
        name: '7号线',
        id: 6
    },
    {
        name: '8号线',
        id: 7
    },
    {
        name: '9号线',
        id: 8
    },
    {
        name: '10号线',
        id: 9
    },
    {
        name: '13号线',
        id: 10
    },
    {
        name: '14号线',
        id: 11
    },
    {
        name: '15号线',
        id: 13
    },
    {
        name: '八通线',
        id: 14
    },
    {
        name: '亦庄线',
        id: 15
    },
    {
        name: '昌平线',
        id: 16
    },
    {
        name: '房山线',
        id: 17
    },
    {
        name: '机场线',
        id: 18
    },
    {
        name: '16号线',
        id: 376
    }
];

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function getCitySubwayRegionData() {

    // 同步读取
    var data = fs.readFileSync(__dirname + '/CitySubwayRegion.json');
    // console.log("同步读取: " + JSON.stringify(JSON.parse(data.toString()).subway_region[0].subways_detail));

    const city_subway_region_json = JSON.parse(data.toString())

     // var city_subways_result = []

    // city_subway_region_json.subway_region.forEach()

    for (const item of city_subway_region_json.subway_region) {
        if (item.city === '武汉') {
            city_chinese = item.city
            city_pinyin = item.city_name


            beijing_subways_map = item.subway
            beijing_administrative_region_map = item.region

            requestRegionDetailData()
            requestSubwaysDetailData()
            
            break
        }
    }
    // city_subway_region_json.subway_region.forEach((item) => {
    //     const city_pinyin = item.city_name
    //     const city_chinese = item.city

    //     var city_subways_result = []
         
    //     var city_regions_result = []
    //     console.log('item:' + JSON.stringify(item))

    //     asyncForEach(item.subway, async (sub) => {
    //         const result = await requestSubwaysDetailData(city_chinese, city_pinyin, sub.id, sub.name)
    //         city_subways_result.push(result)
    //         console.log('sub:' + JSON.stringify(sub))
    //     })

    //     console.log('subway:' + JSON.stringify(city_subways_result))

    //     // item.subway.forEach((sub) => {

    //     //     const result = await requestSubwaysDetailData(city_chinese, city_pinyin, sub.id, sub.name)
    //     //     city_subways_result.push(result)
            
    //     // })

    //     asyncForEach(item.region, async (reg) => {
    //         const result = await requestRegionDetailData(city_chinese, city_pinyin, reg.id, reg.name)
    //         city_regions_result.push(result)
    //         console.log('reg:' + JSON.stringify(reg))
    //     })

    //     // item.region.forEach((reg) => {
    //     //     const result = await requestRegionDetailData(city_chinese, city_pinyin, reg.id, reg.name)
    //     //     city_regions_result.push(result)
    //     // })

    //     // console.log('subway:' + JSON.stringify(city_subways_result))
    //     console.log('region:' + JSON.stringify(city_regions_result))
    // })
    


    // const subways_detail = subway_region.subways_detail
    // const regions_detail = subway_region.regions_detail

    // subways_detail.forEach(item => {

    //     mSubwayStationsMap.set(item.subway_name, item.station_list)
    //     // console.log('subways_detail item:' + item.subway_name)
    // });

    // regions_detail.forEach(item => {
    //     mRegionStationsMap.set(item.region_name, item.station_list)
    // })

    // console.log('mSubwayStationsMap:' + mSubwayStationsMap)


    // mSubwayStationsJson = '' // read file json
}

//城市行政列表
async function requestCityRegionData() {

    var city_subways_result = []

    var api = 'http://uz.yurixu.com/uz/index/getArea?city=beijing&id='

    var subways = []
    // console.log('beijing_subways_map: ' + JSON.stringify(beijing_subways_map.length))
    for (let index = 0; index < beijing_administrative_region_map.length; index++) {
        // const tapi = api + beijing_administrative_region_map[index].id
        // let result = await request.getSC(tapi, {})
        // const ways = JSON.parse(result.body).data
        // subways = []
        // // console.log('ways:' + JSON.stringify(ways))
        // for (let j = 0; j < ways.length; j++) {

        //     subways.push({
        //         id: ways[j].id,
        //         name: ways[j].name,
        //         latlong: ''
        //     })
        //     // console.log('station:' + JSON.stringify(ways[j]))
        // }

        city_subways_result.push({
            id: beijing_administrative_region_map[index].id,
            name: beijing_administrative_region_map[index].name
        })

    }

    // let result = await request.getSC(api, {})

    console.log("city_region_result:" + JSON.stringify(city_subways_result))
    // return result
}



async function addressToLatLon(city, address) {
    // const tapi = 'https://restapi.amap.com/v3/geocode/geo/?key=06a39860cdf741c5dc5ba1242112ab72&city=encodeURI(' + city + ')&address=encodeURI(' + address + ')'

    var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + city + '&address=' + address
    // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
    // console.log(tapi)
    let result = await request.getSC(encodeURI(tapi), {})
    const data = JSON.parse(result.body)

    var latlon = data.geocodes[0].location.split(',')

    // console.log(geohash.encode(37.8324, 112.5584));
    // // prints ww8p1r4t8
    // var latlon = geohash.decode('ww8p1r4t8');
    // console.log(latlon[0]);
    // console.log(latlon[1]);

    // console.log(geohash.encode(latlon[0], latlon[1], precision = 11));

    // var latlon1 = geohash.decode(geohash.encode(latlon[0], latlon[1]));
    // console.log(latlon1)
    // console.log(latlon1.latitude);
    // console.log(latlon1.longitude);

    return {
        latlon: data.geocodes[0].location,
        geohash: Geohash.encode(latlon[0], latlon[1], 9)
    }


}

function testGeoHash() {

    
    console.log(Geohash.encode(116.309585, 40.062594, 6));
    // prints ww8p1r4t8
    // var latlon = geohash.decode('ww8p1r4t8');
    // console.log(latlon[0]);
    // console.log(latlon[1]);

    // console.log(geohash.encode(latlon[0], latlon[1], precision = 11));

    // var latlon1 = geohash.decode(geohash.encode(latlon[0], latlon[1]));
    // console.log(latlon1)
    // console.log(latlon1.latitude);
    // console.log(latlon1.longitude);
}

async function requestRegionDetailData(city_chinese, city_pinyin, regionid, regionname) {
    var tapi = 'http://uz.yurixu.com/uz/index/getArea?city= ' + city_pinyin + '&id=' + regionid
    let result = await request.getSC(tapi, {})
    const ways = JSON.parse(result.body).data
    let subways = []

    // var city_subways_result = []

    for (let j = 0; j < ways.length; j++) {

        var address = ways[j].name
        var amapapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + city_chinese + '&address=' + address
        // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
        // console.log(tapi)
        let result = await request.getSC(encodeURI(amapapi), {})
        let body = JSON.parse(result.body)

        var lotlon_str = ''
        var geohash_str = ''
        if (body.geocodes.length > 0) {
            const geocode = body.geocodes[0]
            if (geocode.location !== undefined) {
                lotlon_str = geocode.location
                var latlon = geocode.location.split(',')
                geohash_str = Geohash.encode(latlon[0], latlon[1], precision = 11)
            }
        }

        subways.push({
            id: parseInt(ways[j].id),
            name: ways[j].name,
            latlon: lotlon_str,
            geohash: geohash_str
        })

        // console.log('station:' + JSON.stringify(ways[j]))
    }

    // city_subways_result.push({
    //     id: regionid,
    //     region_name: regionname,
    //     station_list: subways
    // })

    return {
        id: regionid,
        region_name: regionname,
        station_list: subways
    }
}

// 行政区域 详情列表
async function requestRegionDetailData() {

    var city_subways_result = []

    var api = 'http://uz.yurixu.com/uz/index/getArea?city=' + city_pinyin + '&id='

    var subways = []
    var city = city_chinese
    // console.log('beijing_subways_map: ' + JSON.stringify(beijing_subways_map.length))
    for (let index = 0; index < beijing_administrative_region_map.length; index++) {
        const tapi = api + beijing_administrative_region_map[index].id
        let result = await request.getSC(tapi, {})
        const ways = JSON.parse(result.body).data
        subways = []
        // console.log('ways:' + JSON.stringify(ways))
        for (let j = 0; j < ways.length; j++) {


            var address = ways[j].name
            var amapapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + city + '&address=' + address
            // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
            // console.log(tapi)
            let result = await request.getSC(encodeURI(amapapi), {})
            let body = JSON.parse(result.body)

            var lotlon_str = ''
            var geohash_str = ''
            if (body.geocodes.length > 0) {
                const geocode = body.geocodes[0]

                // console.log('geocode:' + JSON.stringify(geocode))
                if (geocode.location !== undefined) {
                    lotlon_str = geocode.location
                    var latlon = geocode.location.split(',')
                    geohash_str = Geohash.encode(latlon[0], latlon[1], precision = 11)
                }

            }

            subways.push({
                id: parseInt(ways[j].id),
                name: ways[j].name,
                latlon: lotlon_str,
                geohash: geohash_str
            })

            // console.log('station:' + JSON.stringify(ways[j]))
        }

        city_subways_result.push({
            id: parseInt(beijing_administrative_region_map[index].id),
            region_name: beijing_administrative_region_map[index].name,
            station_list: subways
        })

    }

    // let result = await request.getSC(api, {})

    console.log("city_area_result:" + JSON.stringify(city_subways_result))
    // return result
}

// 地铁与站台数据列表
async function requestSubwaysDetailData(city_chinese, city_pinyin, subwayid, subwayname) {
    // var city_subways_result = []

    var tapi = 'http://uz.yurixu.com/uz/index/getLine?city=' + city_pinyin + '&id=' + subwayid
    console.log('tapi:' + tapi)
    var subways = []
    let result = await request.getSC(tapi, {})
    const ways = JSON.parse(result.body).data
    console.log('ways length:' + JSON.stringify(ways.length))
    for (let j = 0; j < ways.length; j++) {

        var address = ways[j].name + '地铁站'
        var amapapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + city_chinese + '&address=' + address
        // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
        // console.log(tapi)
        let result = await request.getSC(encodeURI(amapapi), {})
        let body = JSON.parse(result.body)

        var lotlon_str = ''
        var geohash_str = ''
        if (body.geocodes.length > 0) {
            const geocode = body.geocodes[0]

            // console.log('geocode:' + JSON.stringify(geocode))
            if (geocode.location !== undefined) {
                lotlon_str = geocode.location
                var latlon = geocode.location.split(',')
                geohash_str = Geohash.encode(latlon[0], latlon[1], precision = 11)
            }

        }

        subways.push({
            id: parseInt(ways[j].id),
            name: ways[j].name,
            latlon: lotlon_str,
            geohash: geohash_str
        })
        // console.log('station:' + JSON.stringify(ways[j]))
    }

    // city_subways_result.push({
    //     id: parseInt(subwayid),
    //     subway_name: subwayname,
    //     station_list: subways
    // })

    return {
        id: parseInt(subwayid),
        subway_name: subwayname,
        station_list: subways
    }
}

// 地铁与站台数据列表
async function requestSubwaysDetailData() {

    var city_subways_result = []

    var api = 'http://uz.yurixu.com/uz/index/getLine?city=' + city_pinyin + '&id='

    var subways = []
    var city = city_chinese
    // console.log('beijing_subways_map: ' + JSON.stringify(beijing_subways_map.length))
    for (let index = 0; index < beijing_subways_map.length; index++) {
        const tapi = api + beijing_subways_map[index].id
        let result = await request.getSC(tapi, {})
        const ways = JSON.parse(result.body).data
        subways = []
        // console.log('ways:' + JSON.stringify(ways))
        for (let j = 0; j < ways.length; j++) {

            var address = ways[j].name + '地铁站'
            var amapapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + city + '&address=' + address
            // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
            // console.log(tapi)
            let result = await request.getSC(encodeURI(amapapi), {})
            let body = JSON.parse(result.body)

            var lotlon_str = ''
            var geohash_str = ''
            if (body.geocodes.length > 0) {
                const geocode = body.geocodes[0]

                // console.log('geocode:' + JSON.stringify(geocode))
                if (geocode.location !== undefined) {
                    lotlon_str = geocode.location
                    var latlon = geocode.location.split(',')
                    geohash_str = Geohash.encode(latlon[0], latlon[1], precision = 11)
                }

            }
         
            subways.push({
                id: parseInt(ways[j].id),
                name: ways[j].name,
                latlon: lotlon_str,
                geohash: geohash_str
            })
            // console.log('station:' + JSON.stringify(ways[j]))
        }

        city_subways_result.push({
            id: parseInt(beijing_subways_map[index].id),
            subway_name: beijing_subways_map[index].name,
            station_list: subways
        })

    }

    // let result = await request.getSC(api, {})

    console.log("city_subways_result:" + JSON.stringify(city_subways_result))
    // return result
}

async function getWuhanSubwayAndRegionData() {

}

// 城市地铁列表
async function requestSubwayData() {

    var city_subways_result = []

    var api = 'http://uz.yurixu.com/uz/index/getLine?city=beijing&id='

    var subways = []
    // console.log('beijing_subways_map: ' + JSON.stringify(beijing_subways_map.length))
    for (let index = 0; index < beijing_subways_map.length; index++) {
        // const tapi = api + beijing_subways_map[index].id
        // let result = await request.getSC(tapi, {})
        // const ways = JSON.parse(result.body).data
        // subways = []
        // // console.log('ways:' + JSON.stringify(ways))
        // for (let j = 0; j < ways.length; j++) {

        //     subways.push({
        //         id: ways[j].id,
        //         name: ways[j].name,
        //         latlong: ''
        //     })
        //     // console.log('station:' + JSON.stringify(ways[j]))
        // }

        city_subways_result.push({
            id: beijing_subways_map[index].id,
            name: beijing_subways_map[index].name
        })

    }

    // let result = await request.getSC(api, {})

    // console.log("city_subways_region_result:" + JSON.stringify(city_subways_result))
    // return result
}

// 城市地铁列表
async function getBeijingSubways3() {


    var addresslist = { "id": 18, "subway_name": "3号线", "station_list": [{ "name": "田村", "latlon": "", "geohash": "" }, { "name": "永定路", "latlon": "", "geohash": "" }, { "name": "永定路", "latlon": "", "geohash": "" }, { "name": "定慧桥", "latlon": "", "geohash": "" }, { "name": "西钓鱼台", "latlon": "", "geohash": "" }, { "name": "航天桥", "latlon": "", "geohash": "" }, { "name": "白堆子", "latlon": "", "geohash": "" }, { "name": "展览路", "latlon": "", "geohash": "" }, { "name": "阜成门", "latlon": "", "geohash": "" }, { "name": "西四", "latlon": "", "geohash": "" }, { "name": "北海公园", "latlon": "", "geohash": "" }, { "name": "中国美术馆", "latlon": "", "geohash": "" }, { "name": "东四", "latlon": "", "geohash": "" }, { "name": "东四十条", "latlon": "", "geohash": "" }, { "name": "工人体育场", "latlon": "", "geohash": "" }, { "name": "团结湖", "latlon": "", "geohash": "" }, { "name": "朝阳公园", "latlon": "", "geohash": "" }, { "name": "石佛营", "latlon": "", "geohash": "" }, { "name": "姚家园", "latlon": "", "geohash": "" }, { "name": "平房", "latlon": "", "geohash": "" }, { "name": "高杨树", "latlon": "", "geohash": "" }, { "name": "东坝", "latlon": "", "geohash": "" }] }
    var city_subways_result = []

    var resultList = []

    let prefixId = 400

     for (let index = 0; index < addresslist.station_list.length; index++) {
         const item = addresslist.station_list[index];
         console.log('item:' + item.name)

         var amapapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=' + '北京' + '&address=' + item.name
         // var tapi = 'https://restapi.amap.com/v3/geocode/geo?key=06a39860cdf741c5dc5ba1242112ab72&city=北京&address=五道口'
         // console.log(tapi)
         let result = await request.getSC(encodeURI(amapapi), {})
         let body = JSON.parse(result.body)

         var lotlon_str = ''
         var geohash_str = ''
         if (body.geocodes.length > 0) {
             const geocode = body.geocodes[0]

             console.log('geocode:' + JSON.stringify(geocode))
             if (geocode.location !== undefined) {
                 console.log('geocode2 :')
                 lotlon_str = geocode.location
                 var latlon = geocode.location.split(',')
                 geohash_str = Geohash.encode(latlon[0], latlon[1], precision = 11)

                 resultList.push({
                     id: prefixId++,
                     name: item.name,
                     latlon: lotlon_str,
                     geohash: geohash_str
                 })
             }

         }
    }



     console.log("result:" + JSON.stringify(resultList))
    // return result
}



// async function requestSubwaysData(api) {

//     var city_subways_result = []
    
//     var api = 'http://uz.yurixu.com/uz/index/getLine?city=beijing&id='

//     var subways = []
//     // console.log('beijing_subways_map: ' + JSON.stringify(beijing_subways_map.length))
//     for (let index = 0; index < beijing_subways_map.length; index++) {
//         const tapi = api + beijing_subways_map[index].id
//         let result = await request.getSC(tapi, {})
//         const ways = JSON.parse(result.body).data
//         subways = []
//         // console.log('ways:' + JSON.stringify(ways))
//         for (let j = 0; j < ways.length; j++) {
            
//             subways.push({
//                 id: ways[j].id,
//                 name: ways[j].name,
//                 latlong: ''
//             })
//             // console.log('station:' + JSON.stringify(ways[j]))
//         }

//         city_subways_result.push({
//             subway_name: beijing_subways_map[index].name,
//             station_list: subways
//         })

//     }

//     // let result = await request.getSC(api, {})

//     console.log("city_subways_result:" +  JSON.stringify(city_subways_result))
//     // return result
// }



const ORIGIN_DATA = `{
	"metros_list": [{"name":"1号线","pattern":["1号","一号"]},{"name":"2号线","pattern":["2号","二号"]}, {"name":"3号线","pattern":["3号","三号"]}, {"name":"4号线","pattern":["4号","四号"]}, {"name":"5号线","pattern":["5号","五号"]}, {"name":"6号线","pattern":["6号","六号"]}, {"name":"7号线","pattern":["7号","七号"]}, {"name":"8号线","pattern":["8号","八号"]}, {"name":"9号线","pattern":["9号","九号"]},{"name":"10号线","pattern":["10号","十号"]}, {"name":"11号线","pattern":["11号","十一号"]}, {"name":"12号线","pattern":["12号","十二号"]}, {"name":"13号线","pattern":["13号","十三号"]},{"name":"14号线","pattern":["14号","十四号"]},{"name":"15号线","pattern":["15号","十五号"]}, {"name":"八通线","pattern":["八通"]}, {"name":"亦庄线","pattern":["亦庄"]}, {"name":"昌平线","pattern":["昌平"]}, {"name":"房山线","pattern":["房山"]}, {"name":"机场线","pattern":["机场"]}, {"name":"16号线","pattern":["16号","十六号"]}],
	"district_list": ["海淀",
		"昌平",
		"朝阳",
		"通州"
	],

	"domain_list": [{
			"name": "ICP备案查询",
			"url": "https://icp.sojson.com"
		},
		{
			"name": "JSON在线解析",
			"url": "https://www.sojson.com"
		},
		{
			"name": "房贷计算器",
			"url": "https://fang.sojson.com"
		}
	]
}`


var regular = {};

// 检测帖子是否是垃圾广告、中介等等
regular.verify = function(origin) {

    return true
}


// {
//     "code": 0,
//         "msg": "success",
//             "datetime": "0.821044921875 ms",
//                 "data": [{
//                     "id": "19",
//                     "type": "2",
//                     "name": "苹果园",
//                     "pinyin": "PINGGUOYUAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "20",
//                     "type": "2",
//                     "name": "古城",
//                     "pinyin": "GUCHENG",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "21",
//                     "type": "2",
//                     "name": "八角游乐园",
//                     "pinyin": "BAJIAOYOULEYUAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "22",
//                     "type": "2",
//                     "name": "八宝山",
//                     "pinyin": "BABAOSHAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "23",
//                     "type": "2",
//                     "name": "玉泉路",
//                     "pinyin": "YUQUANLU",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "24",
//                     "type": "2",
//                     "name": "五棵松",
//                     "pinyin": "WUKESONG",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "25",
//                     "type": "2",
//                     "name": "万寿路",
//                     "pinyin": "WANSHOULU",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "26",
//                     "type": "2",
//                     "name": "公主坟",
//                     "pinyin": "GONGZHUFEN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "27",
//                     "type": "2",
//                     "name": "军事博物馆",
//                     "pinyin": "JUNSHIBOWUGUAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "28",
//                     "type": "2",
//                     "name": "木樨地",
//                     "pinyin": "MUDI",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "29",
//                     "type": "2",
//                     "name": "南礼士路",
//                     "pinyin": "NANLISHILU",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "30",
//                     "type": "2",
//                     "name": "复兴门",
//                     "pinyin": "FUXINGMEN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "31",
//                     "type": "2",
//                     "name": "西单",
//                     "pinyin": "XIDAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "32",
//                     "type": "2",
//                     "name": "天安门西",
//                     "pinyin": "TIANANMENXI",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "33",
//                     "type": "2",
//                     "name": "天安门东",
//                     "pinyin": "TIANANMENDONG",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "34",
//                     "type": "2",
//                     "name": "王府井",
//                     "pinyin": "WANGFUJING",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "35",
//                     "type": "2",
//                     "name": "东单",
//                     "pinyin": "DONGDAN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "36",
//                     "type": "2",
//                     "name": "建国门",
//                     "pinyin": "JIANGUOMEN",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "37",
//                     "type": "2",
//                     "name": "永安里",
//                     "pinyin": "YONGANLI",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "38",
//                     "type": "2",
//                     "name": "国贸",
//                     "pinyin": "GUOMAO",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "39",
//                     "type": "2",
//                     "name": "大望路",
//                     "pinyin": "DAWANGLU",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "40",
//                     "type": "2",
//                     "name": "四惠",
//                     "pinyin": "SIHUI",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }, {
//                     "id": "41",
//                     "type": "2",
//                     "name": "四惠东",
//                     "pinyin": "SIHUIDONG",
//                     "parentid": "1",
//                     "create_time": "2016-11-17 11:52:41",
//                     "operate_time": "2017-11-09 14:16:33"
//                 }]
// }

regular.getBeijingSubways = function() {

    const api = 'http://uz.yurixu.com/uz/index/getLine?city=beijing&id=1'


    // requestRegionDetailData();
    // requestSubwaysData();

    requestSubwaysDetailData()
    // requestAreaData();

    // requestRegionDetailData()
    // requestCityRegionData()
    // 
    // requestSubwayData()
    // addressToLatLon('北京', '五道口')


}

function test() {
    regular.getBeijingSubways()

}


module.exports = regular;

Promise.resolve()
    // .then(indexOf('1000转租东坝金隅汇景苑单间（近将台）'));
    // .then(catch_list);
    //  .then(dropIndex)
    // .then(initIndex)
    //     .then(test_list())
    // .then(test_date_compare())
    //     .then(test_date_compare())
    // .then(uploadDate(""))
    // .then(test())
    // .then(getCitySubwayRegionData)
    // .then(getBeijingSubways3)