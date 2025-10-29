import React, { useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

const libraries = ["places"];

export default function RouteForm() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [startPosition, setStartPosition] = useState(null);
  const [endPosition, setEndPosition] = useState(null);
  const [waypointPositions, setWaypointPositions] = useState([]);
  const [directions, setDirections] = useState(null);
  const [avoidTolls, setAvoidTolls] = useState(false);

  const startRef = useRef(null);
  const endRef = useRef(null);
  const waypointRefs = useRef([]);
  
  // 新しい経由地参照を作成する関数
  const createWaypointRef = () => {
    const newRef = React.createRef();
    return newRef;
  };

  const mapCenter = startPosition || endPosition || { lat: 35.681236, lng: 139.767125 };

  const handlePlaceChanged = (ref, textSetter, posSetter) => {
    const places = ref.current.getPlaces();
    if (!places || places.length === 0) return;

    const place = places[0];

    // 座標だけ保持
    posSetter({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });

    // テキストボックスには固有名詞（place.name）をセット
    textSetter(place.name);

    // 経路リセット
    setDirections(null);
  };

  const recalculateRoute = () => {
    if (startPosition && endPosition) {
      setDirections(null); // これにより新しい DirectionsService が実行されます
    }
  };

  const handleAddWaypoint = () => {
    setWaypoints([...waypoints, ""]);
    setWaypointPositions([...waypointPositions, null]);
    waypointRefs.current = [...waypointRefs.current, createWaypointRef()];
  };

  const handleRemoveWaypoint = (index) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    const newWaypointPositions = waypointPositions.filter((_, i) => i !== index);
    waypointRefs.current = waypointRefs.current.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    setWaypointPositions(newWaypointPositions);
    // 経由地を削除した後に経路を再計算
    setTimeout(() => recalculateRoute(), 0);
  };

  const handleWaypointChange = (index, value) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = value;
    setWaypoints(newWaypoints);
  };

  const handleSearch = () => {
    if (startRef.current) handlePlaceChanged(startRef, setStart, setStartPosition);
    if (endRef.current) handlePlaceChanged(endRef, setEnd, setEndPosition);
    waypointRefs.current.forEach((ref, index) => {
      if (ref.current) {
        const places = ref.current.getPlaces();
        if (!places || places.length === 0) return;
        const place = places[0];
        const newWaypointPositions = [...waypointPositions];
        newWaypointPositions[index] = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setWaypointPositions(newWaypointPositions);
        const newWaypoints = [...waypoints];
        newWaypoints[index] = place.name;
        setWaypoints(newWaypoints);
      }
    });
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="start-input" style={{ display: "block", marginBottom: "5px" }}>出発地：</label>
          <StandaloneSearchBox
            onLoad={(ref) => (startRef.current = ref)}
            onPlacesChanged={() => handlePlaceChanged(startRef, setStart, setStartPosition)}
          >
            <input
              id="start-input"
              type="text"
              placeholder="出発地を入力"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{ width: "300px", padding: "8px" }}
            />
          </StandaloneSearchBox>
        </div>

        {/* 経由地 */}
        {waypoints.map((waypoint, index) => (
          <div key={index} style={{ marginBottom: "15px", display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor={`waypoint-${index}`} style={{ display: "block", marginBottom: "5px" }}>
                経由地 {index + 1}：
              </label>
              <StandaloneSearchBox
                onLoad={(ref) => (waypointRefs.current[index] = ref)}
                onPlacesChanged={() => {
                  const ref = waypointRefs.current[index];
                  if (ref) {
                    const places = ref.getPlaces();
                    if (places && places.length > 0) {
                      handleWaypointChange(index, places[0].name);
                      const newWaypointPositions = [...waypointPositions];
                      newWaypointPositions[index] = {
                        lat: places[0].geometry.location.lat(),
                        lng: places[0].geometry.location.lng(),
                      };
                      setWaypointPositions(newWaypointPositions);
                      // 経由地が更新されたら経路を再計算
                      setTimeout(() => recalculateRoute(), 0);
                    }
                  }
                }}
              >
                <input
                  id={`waypoint-${index}`}
                  type="text"
                  placeholder={`経由地${index + 1}を入力`}
                  value={waypoint}
                  onChange={(e) => handleWaypointChange(index, e.target.value)}
                  style={{ width: "300px", padding: "8px" }}
                />
              </StandaloneSearchBox>
            </div>
            <button
              onClick={() => handleRemoveWaypoint(index)}
              style={{ marginLeft: "10px", padding: "8px" }}
            >
              削除
            </button>
          </div>
        ))}

        <button
          onClick={handleAddWaypoint}
          style={{ marginBottom: "15px", padding: "8px" }}
        >
          経由地を追加
        </button>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="end-input" style={{ display: "block", marginBottom: "5px" }}>目的地：</label>
          <StandaloneSearchBox
            onLoad={(ref) => (endRef.current = ref)}
            onPlacesChanged={() => handlePlaceChanged(endRef, setEnd, setEndPosition)}
          >
            <input
              id="end-input"
              type="text"
              placeholder="目的地を入力"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{ width: "300px", padding: "8px" }}
            />
          </StandaloneSearchBox>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={avoidTolls}
              onChange={(e) => setAvoidTolls(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            有料道路を使用しない
          </label>
        </div>

        <button onClick={handleSearch} style={{ padding: "8px 16px" }}>
          検索
        </button>

        {/* 地図 */}
        <GoogleMap mapContainerStyle={{ height: "500px", width: "800px", marginTop: "20px" }} center={mapCenter} zoom={12}>
          {/* マーカーの表示 */}
          {startPosition && <Marker position={startPosition} label={{ text: "出発", color: "white" }} />}
          {endPosition && <Marker position={endPosition} label={{ text: "到着", color: "white" }} />}
          {waypointPositions.map((position, index) => 
            position && (
              <Marker 
                key={index} 
                position={position} 
                label={{ text: `経由${index + 1}`, color: "white" }}
              />
            )
          )}
          
          {/* 経路表示 */}
          {startPosition && endPosition && !directions && (
            <DirectionsService
              options={{
                origin: startPosition,
                destination: endPosition,
                travelMode: "DRIVING",
                waypoints: waypointPositions
                  .filter(pos => pos !== null)
                  .map(pos => ({
                    location: pos,
                    stopover: true
                  })),
                optimizeWaypoints: true,
                avoidTolls: avoidTolls,
                provideRouteAlternatives: true
              }}
              callback={(result, status) => {
                if (status === "OK" && result) setDirections(result);
              }}
            />
          )}

          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }}/>}
        </GoogleMap>
      </div>
    </LoadScript>
  );
}
