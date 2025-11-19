import React, { useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import "./RouteForm.css";

const libraries = ["places"];

export default function RouteForm() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [startPosition, setStartPosition] = useState(null);
  const [endPosition, setEndPosition] = useState(null);
  const [waypointPositions, setWaypointPositions] = useState([]);
  const [directions, setDirections] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
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
    // 入力チェック: 出発地と目的地の両方が必要
    if (!start || !end) {
      setErrorMessage("出発地か目的地が空欄です");
      return;
    }
    setErrorMessage("");

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
      <div className="route-form-container">
        <header className="app-header">
          <h1 className="app-title">StopByMap</h1>
        </header>

        <div className="form-container">
          <div className="input-group">
            <label htmlFor="start-input" className="input-label">出発地</label>
            <StandaloneSearchBox
              onLoad={(ref) => (startRef.current = ref)}
              onPlacesChanged={() => handlePlaceChanged(startRef, setStart, setStartPosition)}
            >
              <input
                id="start-input"
                type="text"
                placeholder="出発地を入力"
                value={start}
                onChange={(e) => {
                  const v = e.target.value;
                  setStart(v);
                  // 入力が消されたら位置情報をクリアし経路をリセット
                  if (v === "") {
                    setStartPosition(null);
                    setDirections(null);
                  }
                }}
                className="search-input"
              />
            </StandaloneSearchBox>
          </div>

          {/* 経由地 */}
          {waypoints.map((waypoint, index) => (
            <div key={index} className="input-group">
              <div className="waypoint-container">
                <div style={{ flex: 1 }}>
                  <label htmlFor={`waypoint-${index}`} className="input-label">
                    経由地 {index + 1}
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
                      className="search-input"
                    />
                  </StandaloneSearchBox>
                </div>
                <button
                  onClick={() => handleRemoveWaypoint(index)}
                  className="remove-waypoint"
                  aria-label="経由地を削除"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddWaypoint}
            className="add-waypoint"
          >
            + 経由地を追加
          </button>

          <div className="input-group">
            <label htmlFor="end-input" className="input-label">目的地</label>
            <StandaloneSearchBox
              onLoad={(ref) => (endRef.current = ref)}
              onPlacesChanged={() => handlePlaceChanged(endRef, setEnd, setEndPosition)}
            >
              <input
                id="end-input"
                type="text"
                placeholder="目的地を入力"
                value={end}
                onChange={(e) => {
                  const v = e.target.value;
                  setEnd(v);
                  // 一度設定された目的地が消された場合、位置情報をクリア
                  if (v === "") {
                    setEndPosition(null);
                    setDirections(null);
                  }
                }}
                className="search-input"
              />
            </StandaloneSearchBox>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="avoid-tolls"
              checked={avoidTolls}
              onChange={(e) => setAvoidTolls(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="avoid-tolls" className="checkbox-label">
              有料道路を使用しない
            </label>
          </div>

          <button onClick={handleSearch} className="search-button">
            ルートを検索
          </button>
          {errorMessage && (
            <div style={{ color: "#c00", marginTop: "0.5rem" }}>{errorMessage}</div>
          )}
        </div>

        {/* 地図 */}
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={{
              height: "calc(100vh - 600px)",
              minHeight: "400px",
              width: "100%"
            }}
            center={mapCenter}
            zoom={12}
          >
            {startPosition && (
              <Marker 
                position={startPosition} 
                label={{ text: "出発", color: "white" }} 
              />
            )}
            {endPosition && (
              <Marker 
                position={endPosition} 
                label={{ text: "到着", color: "white" }} 
              />
            )}
            {waypointPositions.map((position, index) => {
              return position ? (
                <Marker 
                  key={index} 
                  position={position} 
                  label={{ text: `経由${index + 1}`, color: "white" }}
                />
              ) : null;
            })}
            {startPosition && (
              <Marker 
                position={startPosition} 
                label={{ text: "出発", color: "white" }} 
              />
            )}
            {endPosition && (
              <Marker 
                position={endPosition} 
                label={{ text: "到着", color: "white" }} 
              />
            )}
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
            {directions && (
              <DirectionsRenderer 
                directions={directions}
                options={{ suppressMarkers: true }}
              />
            )}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  );
}
