
import React from 'react';

const RouteSteps = ({ steps, activeStep, onStepClick, onStepHover }) => {

  const formatStepNumber = (index) => {
    return (index + 1).toString().padStart(2, '0');
  };

  return (
    <div className="route-steps">
      {steps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h4>Маршрут не построен</h4>
          <p>Добавьте как минимум 2 точки на карте для построения маршрута</p>
        </div>
      ) : (
        <>
          <div className="steps-header">
            <h3>Шаги маршрута</h3>
            <span className="steps-count">{steps.length} шагов</span>
          </div>
          
          <div className="steps-list">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`step-item ${index === activeStep ? 'active' : ''}`}
                onClick={() => onStepClick(step, index)}
                onMouseEnter={() => onStepHover(index)}
                onMouseLeave={() => onStepHover(null)}
              >
                <div className="step-header">
                  <div className="step-number">
                    {formatStepNumber(index)}
                  </div>
                  <div className="step-info">
                    <div className="step-details">
                      <span className="step-distance">
                        <span className="icon">Длина</span>
                        {step.distance || '0.00'} км
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RouteSteps;