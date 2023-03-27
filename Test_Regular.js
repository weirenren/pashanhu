const e = require("express");
var fs = require("fs");

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

var mSubwaysJson
var mSubwayStationsMap = new Map()
var mRegionStationsMap = new Map()

const mCitySubwayStationMap = new Map()




// // 提取地铁线路名称：1号线，2号线； 没有则数组为空
function regularSubwayName(origin) {

    var v = "bl";

    // var re = new RegExp("^\\d+" + v + "$", "gim"); // re为/^\d+bl$/gim

    origin = ' ' + origin

    var orignJson = getOriginJsonObj()

    var match_metro_list = []
    orignJson.metros_list.forEach(li => {
        
        var match = false
        li.pattern.forEach(item=> {
            var re_number = /\d/ // 是否包含数字
            var regex
            if (re_number.test(item)) {
                regex = new RegExp("[^1-9]" + item + "线{1}", "g")
            } else {
                regex = new RegExp("[^十]" + item + "线{1}", "g")
            }

            if (regex.test(origin)) {
                match = true
            }
        })

        if (match) {
            match_metro_list.push(li.name)
        }
    
        // console.log(li.name + ":" + match)
    })

    console.log("match metros:" + match_metro_list + ' origin:' + origin)
    // var regex = /16号线{0,1}/g;
    return match_metro_list
}


function regularRegionStationName(city, regionName, origin) {
    // console.log('regionName:' + regionName)

    var matchStationName = ''
    var geohash = ''

    const cityMap = mRegionStationsMap.get(city)
    if (cityMap) {

        const stationList = cityMap.get(regionName)
        if (stationList) {
            for (const item of stationList) {

                var name = item.name
                // console.log('test item:' + name)
                var regex = new RegExp("" + name + "", "g")
                if (regex.test(origin)) {
                    matchStationName = name
                    geohash = item.geohash

                    break
                }
            }
        }

    }

    return {
        stationName: matchStationName,
        geoHash: geohash
    }
}


function regularRegionStationNameWithNoRegionName(city, origin) {

    var matchStationName = ''
    var matchRegionName = ''
    var geoHash = ''
    const cityMap = mRegionStationsMap.get(city)
    if (cityMap) {
        for (const [key, value] of cityMap) {
            const result = regularRegionStationName(city, key, origin)
            matchStationName = result.stationName
            geoHash = result.geoHash
            // console.log('regularRegionStationNameWithNoRegionName: name ' + key)

            if (matchStationName !== '') {
                matchRegionName = key
                break
            }
        }

    }
 
    return {
        regionName: matchRegionName,
        stationName: matchStationName,
        geoHash
    }
}


// 某个地铁线路中 地铁站名称的提取；若无,则：''
function regularSubwayStationName(city, subwayName, origin) {

   
    var matchStationName = ''
    var geohash = ''
    const cityMap = mSubwayStationsMap.get(city)
    if (cityMap) {
        const stationList = cityMap.get(subwayName)
        if (stationList) {
            for (const item of stationList) {

                var name = item.name
                // console.log('regularSubwayStationName: name ' + name)
                if (name !== '') {
                    var regex = new RegExp("" + name + "", "g")
                    if (regex.test(origin)) {
                        matchStationName = name
                        geohash = item.geohash

                        break
                    }
                }
            }

        }

    }

    return {
        stationName: matchStationName,
        geoHash: geohash
    }
}

// 若存在地铁站名，且地铁线路匹配不出来，则遍历所有地铁线路中地铁站台名称
function regularSubwayStationNameWithNoSubwayName(city, origin) {

    var matchStationName = ''
    var matchSubwayName = ''
    var geoHash = ''
    const cityMap = mSubwayStationsMap.get(city)
    // console.log('citymap:' + JSON.stringify(cityMap))
    if (cityMap) {
        for (const [key, value] of cityMap) {
            const result = regularSubwayStationName(key, origin)
            matchStationName = result.stationName
            geoHash = result.geoHash
            if (matchStationName !== '') {
                matchSubwayName = key
                break
            }
        }
    }
   

    return {
        subwayName: matchSubwayName,
        stationName: matchStationName,
        geoHash
    }
}


function getOriginJsonObj() {
    return JSON.parse(ORIGIN_DATA)
}

function checkIfQiuzu(content) {
    var regex = new RegExp("求租", "g"); // re为/^\d+bl$/gim
}

function test() {

//    var orignJson = getOriginJsonObj()
    

    var testContent = `工作调动现转租，2号线小龟山地铁站，沙湖怡景小区，湖北省图书馆对面，靠近楚河汉街万达广场，小区治安绿化好，距离2号线小龟山地铁站几分钟，此房是电梯房，落地飘窗，实则阳台打通，房间面积大、采光好，长租，可接受短租 ，超高性价比，转租可以和我签或者甲方签，需要私信我哈~`

    // console.log(orignJson.district_list)

    var result = regular.regularRentContent(testContent)

    console.log('match result:' + JSON.stringify(result))
}

function test1() {

    var testContent = `工作调动现转租，2号线小龟山地铁站，沙湖怡景小区，湖北省图书馆对面，靠近楚河汉街万达广场，小区治安绿化好，距离2号线小龟山地铁站几分钟，此房是电梯房，落地飘窗，实则阳台打通，房间面积大、采光好，长租，可接受短租 ，超高性价比，转租可以和我签或者甲方签，需要私信我哈~`

    var tags = regular.matchTags(testContent)

    console.log('tags: ' + tags)
}


var regular = {};


regular.matchTags = function(origin) {

    return regularSubwayName(origin)
}


regular.regularRentContent = function(city, origin) {

    const match_subways = []
    // var match_regions = []
    const dtype_subway = 0
    const dtype_region = 1

    const subwayNameList = regularSubwayName(origin)
    // console.log('subwayNameList:' + JSON.stringify(subwayNameList))

    if (subwayNameList.length > 0) {
        for (const subwayname of subwayNameList) {
            const result = regularSubwayStationName(city, subwayname, origin)
            const stationName = result.stationName
            const geoHash = result.geoHash
            match_subways.push({
                dtype: dtype_subway,
                pname: subwayname,
                cname: stationName,
                geohash: geoHash
            })
        }

    } else {
        const matchResult = regularSubwayStationNameWithNoSubwayName(city, origin)
        // console.log('matchResult:' + matchResult)
        if (matchResult.subwayName !== '') {

            match_subways.push({
                dtype: dtype_subway,
                pname: matchResult.subwayName,
                cname: matchResult.stationName,
                geohash: matchResult.geoHash
            })
        }

        // console.log(matchResult.subwayName)
    }

    const regionResult = regularRegionStationNameWithNoRegionName(city, origin)
    // console.log('regionResult:' + regionResult)
    if (regionResult.regionName !== '') {

        match_subways.push({
            dtype: dtype_region,
            pname: regionResult.regionName,
            cname: regionResult.stationName,
            geoHash: regionResult.geoHash
        })
    }

    return match_subways
}

regular.loadSubwaysJson = function() {
    mSubwaysJson = getOriginJsonObj()

    // 同步读取
    var data = fs.readFileSync(__dirname + '/SubwayAndRegion.json');
    // console.log("同步读取: " + JSON.stringify(JSON.parse(data.toString()).subway_region[0].subways_detail));

    const subway_region = JSON.parse(data.toString()).subway_region



    const beijingSubwayMap = new Map()
    const beijingRegionMap = new Map()
    const wuhanSubwayMap = new Map()
    const wuhanRegionMap = new Map()

    subway_region.forEach((subway_region) => {


        const subways_detail = subway_region.subways_detail
        const regions_detail = subway_region.regions_detail

        subways_detail.forEach(item => {

            if (subway_region.city === '北京') {
                // console.log('subways_detail init:' + JSON.stringify(item))
                beijingSubwayMap.set(item.subway_name, item.station_list)
            }

            if (subway_region.city === '武汉') {
                wuhanSubwayMap.set(item.subway_name, item.station_list)
            }

            // console.log('subways_detail item:' + item.subway_name)
        });

        regions_detail.forEach(item => {

            if (subway_region.city === '北京') {
                // console.log('regions_detail init:' + JSON.stringify(item))
                beijingRegionMap.set(item.subway_name, item.station_list)
            }

            if (subway_region.city === '武汉') {
                wuhanRegionMap.set(item.subway_name, item.station_list)
            }

        })

    })

    mSubwayStationsMap.set('北京', beijingSubwayMap)
    mRegionStationsMap.set('北京', beijingRegionMap)

    mSubwayStationsMap.set('武汉', wuhanSubwayMap)
    mRegionStationsMap.set('武汉', wuhanRegionMap)

    // console.log('mSubwayStationsMap init:' + JSON.stringify(mSubwayStationsMap.get('北京').get('1号线')))


    // mSubwayStationsJson = '' // read file json
}



// 检测帖子是否是垃圾广告、中介等等
regular.verify = function(origin) {

    return true
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
    // .then(regular.loadSubwaysJson())
    // .then(test1())
    // .then(() => {
    //     console.log('test ')
    // })