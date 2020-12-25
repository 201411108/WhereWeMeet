import React, { useEffect, useState } from 'react';
import NaverMapView, { Marker } from './map';
import { TextInput, StyleSheet, PermissionsAndroid, Platform, Text, TouchableOpacity, View, Alert } from 'react-native';

import { getGeoObj, getReverseGeoObj } from './common/geo';

/* TODO ::
    1. Design : 검색 floating button을 눌렀을 때 검색창이 뜨도록
      1.1. searchActivate button 이미지 파일(.svg)
    2. Function : 기능 수행
      2.1. 마커 클릭했을 때 해당 좌표의 세부 정보를 보여주는 창 만들기
      2.2. ReverseCoding으로 해당 좌표에 대한 정보 받아오기
        2.2.1. 도로명 및 일반 주소를 불러오는 방법
          - 도로명 주소와 지번 주소의 동까지는 유사, 이후 주소에서 차이가 있음(land)
          - 'land' key에 대한 내용 확인 필요
*/ 

const MapViewScreen = ({navigation}) => {
  
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const [localInfo, setLocalInfo] = useState({latitude: 37.5665, longitude: 126.87905});
  const [searchFlag, setSearchFlag] = useState(false);
  const [addrInfo, setAddrInfo] = useState('');
  const [infoFlag, setInfoFlag] = useState(false);

  // 마커 띄울 때 해당 정보 창도 같이 뜰 수 있게
  const makeMarker = (latitude, longitude) => {
    return (
      <Marker coordinate={{latitude, longitude}}
        title='해당 영역의 주소'
        description='장소 세부 정보'
        onClick= {async () => {
          // 도로명 주소가 가장 상세 주소를 알 수 있음
          const reverseGeoObj = await getReverseGeoObj(longitude, latitude);
          const addr = reverseGeoObj[2];
          const roadAddr = reverseGeoObj[3];

          console.warn(`Result : ${JSON.stringify(roadAddr['land'])}`);

          // TEST :: 서울이 아닌 지역의 경우 어떻게 되는가
          const area1 = roadAddr['region']['area1']['name']; // e.g) 경기도
          const area2 = roadAddr['region']['area2']['name']; // e.g) 성남시 분당구
          const area3 = roadAddr['region']['area3']['name']; // e.g) 정자동
          const area4 = roadAddr['region']['area4']['name']; // NOTICE :: 용도 확인 필요!!
          const landRoad = roadAddr['land']['name']; // e.g) 불정로
          const landRoadNum1 = roadAddr['land']['number1']; // e.g) 6
          const landRaodNum2 = roadAddr['land']['number2']; // e.g) 없을 수도 있음, 있을 때도 있음. 21-14에서 14에 해당
          const addition0 = roadAddr['land']['addition0']['value']; // e.g) NAVER그린팩토리

          const landAddrNum1 = addr['land']['number1'];
          const landAddrNum2 = addr['land']['number2'];

          const detailAddr = `${addition0}\n${area1} ${area2} ${area3} ${area4} ${landRoad} ${landRoadNum1} ${landRaodNum2}\n${area3} ${landAddrNum1}-${landAddrNum2}`

          setAddrInfo(detailAddr);
          setInfoFlag(!infoFlag);
        }
      }/>
    );
  }

  const searchActivateButton = () => {
    return (
      <TouchableOpacity style={styles.touchableOpacityStyle}
                        onPress={() => navigation.navigate('stack')}>
        <View>
          <Text style={styles.floatingButtonStyle}
                onPress={() => {
                  setSearchFlag(!searchFlag);
                  console.warn('searchBar activate');
                }}>
            Search
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const searchBar = () => {
    return (
      <TextInput style={styles.searchBarStyle}
                 placeholder={"지번, 도로명 주소 입력"}
                 onSubmitEditing={async () => {
                    //  setSearchFlag(!setSearchFlag); 축소시키는 기능도 필요하지 않을까?
                    const result = await getGeoObj(addrInfo);

                    if(result.length != 0) {
                      const addr_x = Number(result[0]['x']);
                      const addr_y = Number(result[0]['y']);
                      console.warn(`latitude : ${addr_x}, longitude : ${addr_y}`);
                      setLocalInfo({latitude: addr_y, longitude: addr_x});
                      makeMarker(addr_y, addr_x);
                    } else {
                      Alert.alert('주소 오류', '해당 주소에 대한 정보가 없습니다.');
                    }
                 }}
                 onChangeText={(text) => {
                   setAddrInfo(text); // TODO :: 렌더링 최적화 필요 -> useEffect
                 }}
      />
    );
  }

  const infoItem = () => {
    return (
      <>
        <Text style={styles.infoItemStyle}>{addrInfo}</Text>
      </>
    )
  }

  return (
    <>
      <NaverMapView style={styles.naverMapViewStyle}
                    showsMyLocationButton={true}
                    center={{...localInfo, zoom: 14}} // DISCUSS :: 무조건 센터로 와야 하나? 이거는 어떠헥 해야 할까?
                    onTouch = {e => {
                      setInfoFlag(false);
                      console.warn('onTouch', JSON.stringify(e.nativeEvent))
                    }}
                    onCameraChange = {e => {
                      setInfoFlag(false);
                      console.warn('onCameraChange', JSON.stringify(e))
                    }}
                    onMapClick = {e => {
                      console.warn('onMapClick', JSON.stringify(e));
                      setLocalInfo({latitude: e.latitude, longitude: e.longitude});
                      setInfoFlag(false);
                    }}
                    useTextureView>
        {makeMarker(localInfo.latitude, localInfo.longitude)}
      </NaverMapView>
      {/* DISCUSS :: 굳이 버튼으로 동작시킬 필요가 있을까? 그냥 검색창만 띄우면 안될까? */}
      {!searchFlag ? searchActivateButton() : searchBar()}
      {infoFlag ? infoItem() : <></>}
    </>
  );
}

const requestLocationPermission = async () => {
  if(Platform.OS !== 'android') return;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'show my location need Location permission',
        buttonNeutral: 'Ask me later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK'
      }
    );
    if(granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the location');
    } else {
      console.log('Locdation permission denied');
    }
  } catch(err) {
    console.warn(err);
  }
}

const styles = StyleSheet.create({
  naverMapViewStyle: {
    width: '100%',
    height: '100%'
  },
  touchableOpacityStyle: {
    position: 'absolute',
    top: '2%',
    right: '4%', // 단위가 생략되어 있다.
    // width: '5%',
    height: '5%'
  },
  floatingButtonStyle: {
    color: 'white',
    backgroundColor: 'gray',
    textAlign: 'center',
    width: 50,
    height: 50,
  },
  searchBarStyle: {
    position: 'absolute',
    top: '2%',
    alignSelf: 'center',
    width: '85%',
    height: '5%',
    borderRadius: 15,
    backgroundColor: 'white',
    padding: 10,
  },
  infoItemStyle: {
    // position: 'absolute',
    bottom: '13%',
    alignSelf: 'center',
    width: '90%',
    height: '10%',
    backgroundColor: 'white',
    padding: 10
  }
});

export default MapViewScreen;