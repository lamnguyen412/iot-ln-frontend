import axios from 'axios';
export const DEMO=import.meta.env.VITE_DEMO_MODE!=='false';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:3000/api',timeout:10000});
export default api;
// Native WebSocket (không phải Socket.IO). Backend cần theo hợp đồng trong README.
export function subscribe(onMessage,onStatus=()=>{}){
 if(DEMO)return ()=>{};
 let socket,timer,stopped=false;
 const connect=()=>{
  if(stopped)return;
  try{socket=new WebSocket(import.meta.env.VITE_WS_URL||'ws://localhost:3000/ws');}catch{onStatus('URL WebSocket không hợp lệ');return;}
  socket.onopen=()=>onStatus('Đã kết nối realtime');
  socket.onmessage=e=>{try{onMessage(JSON.parse(e.data));}catch{onStatus('Dữ liệu realtime không hợp lệ');}};
  socket.onclose=()=>{onStatus('Mất kết nối realtime, đang thử lại…');if(!stopped)timer=setTimeout(connect,3000);};
  socket.onerror=()=>onStatus('Không kết nối được WebSocket');
 };
 connect();return ()=>{stopped=true;clearTimeout(timer);if(socket){socket.onclose=null;socket.close();}};
}
