import React, { useState } from 'react';
import '../styles/components/WarningPanel737.css';

const WarningPanel737 = () => {
  const [masterCaution, setMasterCaution] = useState(false);
  const [fireWarn, setFireWarn] = useState(false);
  const [indicators, setIndicators] = useState({
    fltCont: false,
    irs: false,
    fuel: false,
    elec: false,
    apu: false,
    ovhtDet: false
  });

  const toggleMasterCaution = () => {
    setMasterCaution(!masterCaution);
    if (!masterCaution) {
      // Activate some indicators when master caution is pressed
      setIndicators({
        fltCont: true,
        irs: true,
        fuel: false,
        elec: true,
        apu: false,
        ovhtDet: false
      });
    } else {
      // Reset indicators when master caution is reset
      setIndicators({
        fltCont: false,
        irs: false,
        fuel: false,
        elec: false,
        apu: false,
        ovhtDet: false
      });
      setFireWarn(false);
    }
  };

  const toggleFireWarn = () => {
    setFireWarn(!fireWarn);
    if (!fireWarn) {
      setMasterCaution(true);
      setIndicators({
        ...indicators,
        ovhtDet: true
      });
    }
  };

  const toggleIndicator = (key) => {
    setIndicators({
      ...indicators,
      [key]: !indicators[key]
    });
  };

  return (
    <section className="warning-panel-section">
      <div className="container">
        <div className="warning-panel-737">
          <div className="panel-main-controls">
            <button
              className={`warning-button fire-warn ${fireWarn ? 'active' : ''}`}
              onClick={toggleFireWarn}
            >
              <div className="button-content">
                <div className="button-line-top">FIRE WARN</div>
                <div className="button-line-bottom">BELL CUTOUT</div>
              </div>
            </button>

            <button
              className={`warning-button master-caution ${masterCaution ? 'active' : ''}`}
              onClick={toggleMasterCaution}
            >
              <div className="button-content">
                <div className="button-line-top">MASTER CAUTION</div>
                <div className="button-line-bottom">PUSH TO RESET</div>
              </div>
            </button>
          </div>

          <div className="panel-indicators">
            <div className="indicator-column">
              <button
                className={`indicator-light ${indicators.fltCont ? 'active' : ''}`}
                onClick={() => toggleIndicator('fltCont')}
              >
                FLT CONT
              </button>
              <button
                className={`indicator-light ${indicators.irs ? 'active' : ''}`}
                onClick={() => toggleIndicator('irs')}
              >
                IRS
              </button>
              <button
                className={`indicator-light ${indicators.fuel ? 'active' : ''}`}
                onClick={() => toggleIndicator('fuel')}
              >
                FUEL
              </button>
            </div>

            <div className="indicator-column">
              <button
                className={`indicator-light ${indicators.elec ? 'active' : ''}`}
                onClick={() => toggleIndicator('elec')}
              >
                ELEC
              </button>
              <button
                className={`indicator-light ${indicators.apu ? 'active' : ''}`}
                onClick={() => toggleIndicator('apu')}
              >
                APU
              </button>
              <button
                className={`indicator-light ${indicators.ovhtDet ? 'active' : ''}`}
                onClick={() => toggleIndicator('ovhtDet')}
              >
                OVHT/DET
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarningPanel737;
