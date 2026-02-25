
import React from 'react';

const PointList = ({ points, onDelete, onMove }) => {
  if (points.length === 0) {
    return (
      <div className="points-list">
        <div className="empty-points">
          <div className="empty-icon"></div>
          <p>Точки не добавлены</p>
          <small>Добавьте точки кликом на карте</small>
        </div>
      </div>
    );
  }

  return (
    <div className="points-list">
      <div className="points-container">
        {points.map((point, index) => (
          <div 
            key={index} 
            className={`point-item ${index === 0 ? 'start' : index === points.length - 1 ? 'end' : ''}`}
          >
            <div className="point-header">
              <div className="point-number-container">
                <span className="point-number">
                  {index === 0 ? '🚩' : index === points.length - 1 ? '🏁' : `📍 ${index + 1}`}
                </span>
              </div>
              <div className="point-details">
                <div className="point-coords">
                  <span className="coord-label">Широта:</span>
                  <span className="coord-value">{point[0].toFixed(6)}</span>
                </div>
                <div className="point-coords">
                  <span className="coord-label">Долгота:</span>
                  <span className="coord-value">{point[1].toFixed(6)}</span>
                </div>
              </div>
              <div className="point-actions">
                {index > 0 && (
                  <button 
                    className="point-action-btn move-up" 
                    onClick={() => onMove(index, index - 1)}
                    title="Подвинуть выше"
                  >
                    ↑
                  </button>
                )}
                {index < points.length - 1 && (
                  <button 
                    className="point-action-btn move-down" 
                    onClick={() => onMove(index, index + 1)}
                    title="Подвинуть ниже"
                  >
                    ↓
                  </button>
                )}
                <button 
                  className="point-action-btn delete" 
                  onClick={() => onDelete(index)}
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointList;