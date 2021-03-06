import React, { useEffect, useState } from "react";
import NaverMapView, { Marker } from "./map";
import {
  TextInput,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
  Alert,
  Button,
  View,
  TouchableOpacity
} from "react-native";

import { getGeoObj, getReverseGeoObj } from "./common/geo";
import { getCenter, getLinefromCenter } from "./common/common";

/* NOTICE :: 
  makrerList에 저장되는 데이터 형태
  `{
    idx,
    latitude,
    longitude
  }`
 */
const markerList = [];

const MapViewScreen = ({ navigation }) => {
  useEffect(() => {
    requestLocationPermission();
  }, [addrInfo]);

  const [localInfo, setLocalInfo] = useState({
    latitude: 37.5665,
    longitude: 126.87905
  });
  const [markerFlag, setMarkerFlag] = useState(false);
  const [addrInfo, setAddrInfo] = useState("");
  const [specificPlaceName, setSpecificPlaceName] = useState("");
  const [detailAddrInfo, setDetailAddrInfo] = useState("");
  const [infoFlag, setInfoFlag] = useState(false);

  // TODO :: marker 생성 시 서버에 해당 정보 전송
  const makeMarker = (latitude, longitude, idx) => {
    return (
      <Marker
        coordinate={{ latitude, longitude }}
        key={idx}
        title="해당 영역의 주소"
        description="장소 세부 정보"
        onClick={async () => {
          const reverseGeoObj = await getReverseGeoObj(longitude, latitude);
          const addr = reverseGeoObj[2];
          const roadAddr = reverseGeoObj[3];

          if (typeof roadAddr == "undefined") {
            Alert.alert("주소 오류", "해당 주소에 대한 정보가 없습니다.");
          } else {
            const area1 = roadAddr["region"]["area1"]["name"]; // e.g) 경기도
            const area2 = roadAddr["region"]["area2"]["name"]; // e.g) 성남시 분당구
            const area3 = roadAddr["region"]["area3"]["name"]; // e.g) 정자동
            const area4 = roadAddr["region"]["area4"]["name"]; // NOTICE :: 용도 확인 필요!!
            const landRoad = roadAddr["land"]["name"]; // e.g) 불정로
            const landRoadNum1 = roadAddr["land"]["number1"]; // e.g) 6
            const landRaodNum2 = roadAddr["land"]["number2"]; // e.g) 없을 수도 있음, 있을 때도 있음. 21-14에서 14에 해당
            const addition0 = roadAddr["land"]["addition0"]["value"]; // e.g) NAVER그린팩토리

            const landAddrNum1 = addr["land"]["number1"];
            const landAddrNum2 = addr["land"]["number2"];

            let specificName = "";
            let detailName = "";
            if (addition0 != "") {
              specificName = addition0;
              if (landRaodNum2 != "") {
                detailName = `${area1} ${area2} ${area3} ${area4} ${landRoad} ${landRoadNum1} ${landRaodNum2}(${area3} ${landAddrNum1}-${landAddrNum2})`;
              } else {
                detailName = `${area1} ${area2} ${area3} ${area4} ${landRoad} ${landRoadNum1} ${landRaodNum2}(${area3} ${landAddrNum1})`;
              }
            } else {
              specificName = "특정 장소명이 존재하지 않습니다.";
              if (landRaodNum2 != "") {
                detailName = `${area1} ${area2} ${area3} ${area4} ${landRoad} ${landRoadNum1} ${landRaodNum2}(${area3} ${landAddrNum1}-${landAddrNum2})`;
              } else {
                detailName = `${area1} ${area2} ${area3} ${area4} ${landRoad} ${landRoadNum1} ${landRaodNum2}(${area3} ${landAddrNum1})`;
              }
            }

            setLocalInfo({ latitude, longitude });
            setAddrInfo(specificName + detailName);
            setInfoFlag(!infoFlag);
            setSpecificPlaceName(specificName);
            setDetailAddrInfo(detailName);
            console.log(getCenter(markerList));
          }
        }}
      />
    );
  };

  const searchBar = () => {
    return (
      <TextInput
        style={styles.searchBarStyle}
        placeholder={"지번, 도로명 주소 입력"}
        onSubmitEditing={async () => {
          const result = await getGeoObj(addrInfo);

          if (result.length != 0) {
            const addr_x = Number(result[0]["x"]);
            const addr_y = Number(result[0]["y"]);
            console.warn(`latitude : ${addr_x}, longitude : ${addr_y}`);
            setLocalInfo({ latitude: addr_y, longitude: addr_x });
            setMarkerFlag(true);
            makeMarker(addr_y, addr_x);
          } else {
            Alert.alert("주소 오류", "해당 주소에 대한 정보가 없습니다.");
          }
        }}
        onChangeText={text => {
          setAddrInfo(text);
        }}
      />
    );
  };

  const infoItem = () => {
    return (
      <View style={styles.infoItemStyle}>
        <Text style={styles.infoItemTitleStyle}>{specificPlaceName}</Text>
        <Text style={styles.infoItemDetailStyle}>{detailAddrInfo}</Text>
        <View style={styles.infoItemButtonViewStyle}>
          <Button
            title="Add"
            onPress={() => {
              Alert.alert(`${specificPlaceName} 추가됨`, `${detailAddrInfo}`);
              const len = markerList.length;
              let isExist = false;
              for (let i = 0; i < len; i++) {
                if (
                  markerList[i].latitude == localInfo.latitude &&
                  markerList[i].longitude == localInfo.longitude
                ) {
                  isExist = true;
                  console.log("Already Exist");
                  break;
                }
              }
              if (!isExist) {
                markerList.push({
                  idx: len,
                  latitude: localInfo.latitude,
                  longitude: localInfo.longitude
                });
              }
            }}
          />
          <Button
            title="Remove"
            onPress={() => {
              Alert.alert(`${specificPlaceName} 제거됨`, `${detailAddrInfo}`);
              const len = markerList.length;
              let id = -1;
              for (let i = 0; i < len; i++) {
                if (
                  markerList[i].latitude === localInfo.latitude &&
                  markerList[i].longitude === localInfo.longitude
                ) {
                  id = markerList[i]['idx'];
                  break;
                }
              }

              for (let j = 0; j < len; j++) {
                if(j === id) {
                  markerList.splice(id, 1);
                } else if(j > id) {
                  markerList[j - 1].idx -= 1;
                }
              }
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <NaverMapView
        style={styles.naverMapViewStyle}
        showsMyLocationButton={true}
        center={{ ...localInfo, zoom: 14 }} // DISCUSS :: 수정 필요
        onTouch={e => {
          setInfoFlag(false);
        }}
        onCameraChange={e => {
          setInfoFlag(false);
        }}
        onMapClick={e => {
          setLocalInfo({
            latitude: e.latitude,
            longitude: e.longitude
          });
          setMarkerFlag(true);
          setInfoFlag(false);
        }}
        useTextureView
      >
        {markerFlag ? (
          makeMarker(localInfo.latitude, localInfo.longitude)
        ) : (
          <></>
        )}
        {markerList.map(location =>
          makeMarker(location.latitude, location.longitude, location.idx)
        )}
        {getLinefromCenter(markerList)}
      </NaverMapView>
      {searchBar()}
      {infoFlag ? infoItem() : <></>}
    </>
  );
};

const requestLocationPermission = async () => {
  if (Platform.OS !== "android") return;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "show my location need Location permission",
        buttonNeutral: "Ask me later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the location");
    } else {
      console.log("Locdation permission denied");
    }
  } catch (err) {
    console.warn(err);
  }
};

const styles = StyleSheet.create({
  naverMapViewStyle: {
    width: "100%",
    height: "100%"
  },
  touchableOpacityStyle: {
    position: "absolute",
    top: "2%",
    right: "4%",
    height: "5%"
  },
  searchBarStyle: {
    position: "absolute",
    top: "2%",
    alignSelf: "center",
    width: "85%",
    height: "5%",
    borderRadius: 15,
    backgroundColor: "white",
    padding: 10
  },
  infoItemStyle: {
    flexDirection: "column",
    bottom: "32%",
    alignSelf: "center",
    width: "80%",
    height: "14%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 5
  },
  infoItemTitleStyle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    justifyContent: "center",
    top: "5%",
    margin : 5,
  },
  infoItemDetailStyle: {
    textAlign: "center",
    // margin: 5,
  },
  infoItemButtonViewStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default MapViewScreen;
