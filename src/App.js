// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import RouteSteps from './RouteSteps';
import PointList from './PointList';
import AddressSearch from './AddressSearch';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function App() {
  const [points, setPoints] = useState([]);
  const [route, setRoute] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const mapRef = useRef();

  // Функция для расчета маршрута через OSRM
  const calculateRoute = async (points) => {
    if (points.length < 2) {
      setRoute(null);
      setSteps([]);
      return;
    }

    setLoading(true);
    try {
      const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) throw new Error('Ошибка расчета маршрута');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        setRoute(routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]));
        
        // Извлекаем шаги маршрута
        const allSteps = [];
        if (routeData.legs && routeData.legs.length > 0) {
          routeData.legs.forEach((leg) => {
            if (leg.steps && leg.steps.length > 0) {
              leg.steps.forEach((step) => {
                if (step.maneuver) {
                  allSteps.push({
                    distance: (step.distance / 1000).toFixed(2),
                    duration: Math.round(step.duration / 60),
                    location: [step.maneuver.location[1], step.maneuver.location[0]],
                    geometry: step.geometry.coordinates.map(coord => [coord[1], coord[0]])
                  });
                }
              });
            }
          });
        }
        setSteps(allSteps);
      }
    } catch (error) {
      console.error('Ошибка расчета маршрута:', error);
      // В случае ошибки, показываем прямую линию между точками
      if (points.length >= 2) {
        setRoute(points);
        const simpleSteps = points.map((point, index) => ({
          instruction: index === 0 ? 'Начало маршрута' : 
                      index === points.length - 1 ? 'Конец маршрута' : `Точка ${index + 1}`,
          distance: '0.00',
          duration: 0,
          location: point,
          geometry: [point]
        }));
        setSteps(simpleSteps);
      }
    } finally {
      setLoading(false);
    }
  };

  // Автоматический пересчет маршрута при изменении точек
  useEffect(() => {
    calculateRoute(points);
  }, [points]);

  // Обработчик клика по карте
  const handleMapClick = (latlng) => {
    setPoints(prev => [...prev, latlng]);
  };

  // Обработчик загрузки из TXT
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const newPoints = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const separators = [',', ';', '\t', ' '];
        for (const sep of separators) {
          if (trimmed.includes(sep)) {
            const parts = trimmed.split(sep).map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
              const lat = parseFloat(parts[0]);
              const lng = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                newPoints.push([lat, lng]);
                break;
              }
            }
          }
        }
      });
      
      setPoints(newPoints);
    };
    reader.readAsText(file);
  };

  // Добавление точки по адресу
  const handleAddByAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPoints(prev => [...prev, [lat, lon]]);
        return { success: true, data: data[0] };
      } else {
        return { success: false, error: 'Адрес не найден' };
      }
    } catch (error) {
      return { success: false, error: 'Ошибка поиска адреса' };
    }
  };

  // Обработчик клика по шагу маршрута
  const handleStepClick = (step, index) => {
    setActiveStep(index);
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo(step.location, 16);
    }
  };

  // Удаление точки
  const handleDeletePoint = (index) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  };

  // Перемещение точки
  const handleMovePoint = (fromIndex, toIndex) => {
    const newPoints = [...points];
    const [movedPoint] = newPoints.splice(fromIndex, 1);
    newPoints.splice(toIndex, 0, movedPoint);
    setPoints(newPoints);
  };

  // Очистка всех точек
  const handleClearAll = () => {
    setPoints([]);
    setRoute(null);
    setSteps([]);
    setActiveStep(null);
  };

  return (
    <div className="app">
      {/* Левая панель - Техническая часть */}
      <div className="left-panel">
        <div className="panel-header tech-header">
          <h2>Управление данными и настройки</h2>
        </div>
        
        <div className="panel-section">
          <h3>Загрузка данных</h3>
          <div className="file-upload-section">
            <label className="file-upload-btn large">
               Загрузить координаты из TXT
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <div className="file-info">
              <small>Поддерживаемые форматы:</small>
              <div className="formats">
                <span>55.7558, 37.6173</span>
                <span>55.7558; 37.6173</span>
                <span>55.7558 37.6173</span>
              </div>
            </div>
          </div>
          
          <div className="controls-row">
            <button 
              className="clear-btn large"
              onClick={handleClearAll}
              disabled={points.length === 0}
            >
              Очистить все точки
            </button>
          </div>
        </div>
        
        <div className="panel-section">
          <h3>Статистика</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-label">Точек</div>
                <div className="stat-value">{points.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-label">Шагов</div>
                <div className="stat-value">{steps.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-label">Дистанция</div>
                <div className="stat-value">
                  {steps.length > 0 ? 
                    steps.reduce((acc, step) => acc + parseFloat(step.distance || 0), 0).toFixed(2) : '0.00'} км
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-label">Время</div>
                <div className="stat-value">
                  {steps.length > 0 ? 
                    steps.reduce((acc, step) => acc + (step.duration || 0), 0) : 0} мин
                </div>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Расчет маршрута...</span>
            </div>
          )}
        </div>
      
      </div>
      
      {/* Центральная панель - Карта */}
      <div className="center-panel">
        <MapContainer
          center={[59.938676, 30.314494]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapClick={handleMapClick} />
          
          {/* Маркеры точек */}
          {points.map((point, index) => (
            <Marker 
              key={`point-${index}`}
              position={point}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: ${index === 0 ? '#4CAF50' : index === points.length - 1 ? '#f44336' : '#2196F3'};
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    font-size: 14px;
                  ">
                    ${index + 1}
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              })}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>Точка {index + 1}</strong><br />
                  {point[0].toFixed(6)}, {point[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Маршрут */}
          {route && route.length > 1 && (
            <Polyline
              positions={route}
              color="#2196F3"
              weight={6}
              opacity={0.8}
            />
          )}
          
          {/* Подсветка активного шага */}
          {activeStep !== null && steps[activeStep] && (
            <Polyline
              positions={steps[activeStep].geometry}
              color="#FF9800"
              weight={5}
              opacity={0.9}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
        
        <div className="map-info">
          <div className="map-coordinates">
            <span>Карта с маршрутом - кликайте для добавления точек</span>
          </div>
        </div>
      </div>
      
      {/* Правая панель */}
      <div className="right-panel">
        <div className="panel-header">
          <h2>Этапы маршрута и управление точками</h2>
        </div>
        
               
        <div className="tab-content">
          {/* Секция этапов маршрута */}
          <div className="route-section">
            <RouteSteps 
              steps={steps}
              activeStep={activeStep}
              onStepClick={handleStepClick}
              onStepHover={setActiveStep}
            />
          </div>
          
          {/* Секция управления точками */}
          <div className="points-section">
            <h3>Управление точками</h3>
            
            <AddressSearch onAdd={handleAddByAddress} />
            
            <div className="points-list-wrapper">
              <PointList 
                points={points}
                onDelete={handleDeletePoint}
                onMove={handleMovePoint}
              />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;