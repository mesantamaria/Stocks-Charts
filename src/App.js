import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";
import Chart from "react-google-charts";
import './App.css';
import LightWeightChart from './LightWeightChart';



const PROTOCOL = 'wss://';
const SERVER = 'le-18262636.bitzonte.com';
const PATH = '/stocks';


function App() {
  const [socket, setSocket] = useState(null);
  const [buttonText, setButtonText] = useState("Desconectarse")
  const [stocksValues, setStocksValues] = useState({})  // Key: Stock name, Value: List of values
  const [maxValues, setMaxValues] = useState({})
  const [minValues, setMinValues] = useState({})
  const [initialTime, setInitialTime] = useState(Date.now())

  //const [data, setData] = useState([['x', 'dogs']])
  const [data, setData] = useState([])

  useEffect(() => {
    const sock = socketIOClient(PROTOCOL + SERVER, {
      path: PATH
    })
    setSocket(sock);
    sock.emit('EXCHANGES')
    sock.on('EXCHANGES', (data) => {
      console.log(data)
    })

    sock.on('UPDATE', res => {
      helperMaxValues(res);
      helperMinValues(res);
      setStocksValues(currentData => {
        if (res.ticker in currentData) {
          return {
            ...currentData,
            [res.ticker]: [...currentData[res.ticker], {time: timeInSecs(res.time), value: res.value}]  
          }
        }
        else {
          return {
            ...currentData,
            [res.ticker]: [{time: timeInSecs(res.time), value: res.value}]  
          }
        }
      })
      //setData(currentData => [...currentData, [res.time, res.value]])
      setData(currentData => [...currentData, {time: timeInSecs(res.time), value: res.value}])
    })

  }, [])

  const helperMaxValues = (res) => {
    setMaxValues(currentData => {
      if (!(res.ticker in currentData) || currentData[res.ticker] < res.value) {
        return { ...currentData, [res.ticker]: res.value}  
      } else {
        return { ...currentData }
      }
    })
  }

  const helperMinValues = (res) => {
    setMinValues(currentData => {
      if (!(res.ticker in currentData) || currentData[res.ticker] > res.value) {
        return { ...currentData, [res.ticker]: res.value}  
      } else {
        return { ...currentData }
      }
    })
  }

  const changeState = () => {
    //setData([...data, [3, 100]])
    
    if (socket.connected) {
      socket.close()
      setButtonText('Conectarse')
    }
    else {
      socket.open()
      setButtonText('Desconectarse')
    }
  }

  return (
    <div className="App">
      <div>
        {socket ? 
          <button onClick={changeState}>
              {buttonText}
          </button>
        : null}
      </div>
      <div>
        {Object.keys(stocksValues).map(stock => (
          <div className="container" key={stock}>
            <LightWeightChart stock={stock} data={stocksValues[stock]}/>
            <div className="stats">
              <div className="title">{stock}</div>
              <div className="stat">Volumen Total Transado</div>
              <div className="stat">Alto histórico: {maxValues[stock]}</div>
              <div className="stat">Bajo histórico: {minValues[stock]}</div>
              <div className="stat">Último precio: {getLastElem(stocksValues[stock]).value}</div>
              <div className="stat">Variación porcentual: {variacionPorcentual(stocksValues[stock]).toFixed(2)}%</div>
            </div>
          </div>
        ))
        
        }
      </div>
      {/*Object.keys(stocksValues).map(stock => (
          
          <Chart
            width={'600px'}
            height={'400px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={stocksValues[stock]}
            options={{
              hAxis: {
                title: 'Time',
              },
              vAxis: {
                title: 'Popularity',
              },
            }}
            rootProps={{ 'data-testid': '1' }}
          />
        ))*/}
    
      

    </div>
  );
}

const timeInSecs = (time) => {
  return Math.round(time / 1000) - 4 * 60 * 60
}

const getLastElem = (array) => {
  return array[array.length - 1]
}

const getSecondToLastElem = (array) => {
  return array[array.length - 2]
}

const variacionPorcentual = (array) => {
  if (array.length > 1) {
    const new_value = getLastElem(array).value
    const old_value = getSecondToLastElem(array).value
    return (new_value - old_value) / old_value * 100
  }
  else {
    return 0
  }
}

export default App;
