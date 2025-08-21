// 根据条件获取设备列表
import request from '@/utils/request'


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