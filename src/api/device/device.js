import request from '@/utils/request'

// 根据条件获取设备列表
export function getDeviceList(query) {
    return request({
        headers: {
            isToken: true
        },
        url: '/meters',
        method: 'get',
        params: query
    })
}

//根据设备编号更新设备信息
export function updateDevice(data) {
    return request({
        headers: {
            isToken: true
        },
        url: '/devices',
        method: 'put',
        data
    })
}

//添加设备
export function addDevice(data) {
    return request({
        headers: {
            isToken: true
        },
        url: '/devices',
        method: 'post',
        data
    })
}

//删除设备
export function deleteDevice(deviceCode) {
    return request({
        headers: {
            isToken: true
        },
        url: '/devices/' + deviceCode,
        method: 'delete'
    })
}