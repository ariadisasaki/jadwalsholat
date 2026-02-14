let map, marker;
let audioEnabled = false;
let jadwal = {};

const audioNormal = new Audio("audio/adzan.mp3");
const audioSubuh = new Audio("audio/adzan-subuh.mp3");

function tampilkanTanggal(){
  const hari=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan=["Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"];

  const now=new Date();
  const format=
  `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;

  document.getElementById("tanggal").innerText=format;
}
tampilkanTanggal();

function initMap(lat, lon){

  map=L.map('map').setView([lat,lon],13);

  const osm=L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  const satelit=L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

  osm.addTo(map);

  L.control.layers({
    "OSM":osm,
    "Satelit":satelit
  }).addTo(map);

  marker=L.marker([lat,lon]).addTo(map)
  .bindPopup("Lokasi Anda")
  .openPopup();
}

function hitungJarakKabah(lat1,lon1){
  const lat2=21.4225;
  const lon2=39.8262;

  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;

  const a=
  Math.sin(dLat/2)**2+
  Math.cos(lat1*Math.PI/180)*
  Math.cos(lat2*Math.PI/180)*
  Math.sin(dLon/2)**2;

  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  const d=R*c;

  return d.toFixed(2);
}

async function ambilJadwal(lat, lon){

  const today = new Date();
  const tanggal = today.getDate();
  const bulan = today.getMonth()+1;
  const tahun = today.getFullYear();

  const url =
  `https://api.aladhan.com/v1/timings/${tanggal}-${bulan}-${tahun}?latitude=${lat}&longitude=${lon}&method=11`;

  const res = await fetch(url);
  const data = await res.json();

  jadwal = {
    Subuh: data.data.timings.Fajr,
    Dzuhur: data.data.timings.Dhuhr,
    Ashar: data.data.timings.Asr,
    Maghrib: data.data.timings.Maghrib,
    Isya: data.data.timings.Isha
  };

  document.getElementById("lokasi").innerText =
  "Koordinat: "+lat.toFixed(4)+", "+lon.toFixed(4);
}

function updateCountdown(){

  if(Object.keys(jadwal).length===0) return;

  const now=new Date();
  const currentMinutes=now.getHours()*60+now.getMinutes();

  let nextPrayer=null;
  let minDiff=1440;

  for(let nama in jadwal){

    const waktu = jadwal[nama].split(" ")[0];
    const [h,m]=waktu.split(":");

    const total=parseInt(h)*60+parseInt(m);

    let diff=total-currentMinutes;
    if(diff<0) diff+=1440;

    if(diff<minDiff){
      minDiff=diff;
      nextPrayer=nama;
    }
  }

  const jam=Math.floor(minDiff/60);
  const menit=minDiff%60;

  document.getElementById("countdown")
  .innerText=`Menuju ${nextPrayer}: ${jam} jam ${menit} menit`;
}

function cekWaktu(){

  if(Object.keys(jadwal).length===0) return;

  const now=new Date();
  const jamSekarang=
  now.getHours().toString().padStart(2,'0')+":"+
  now.getMinutes().toString().padStart(2,'0');

  for(let nama in jadwal){

    const waktu = jadwal[nama].split(" ")[0];

    if(jamSekarang===waktu){

      if(Notification.permission==="granted"){
        new Notification("Waktu Sholat "+nama+" telah masuk");
      }

      if(audioEnabled){
        if(nama==="Subuh"){
          audioSubuh.play();
        }else{
          audioNormal.play();
        }
      }
    }
  }
}

navigator.geolocation.getCurrentPosition(async pos=>{

  const lat=pos.coords.latitude;
  const lon=pos.coords.longitude;

  initMap(lat,lon);

  const jarak=hitungJarakKabah(lat,lon);
  document.getElementById("jarakKabah")
  .innerText="Jarak ke Ka'bah: "+jarak+" km";

  await ambilJadwal(lat,lon);

  setInterval(updateCountdown,1000);
  setInterval(cekWaktu,1000);
});

document.getElementById("enableAudio")
.addEventListener("click",()=>{

  audioEnabled=true;

  audioNormal.play().then(()=>audioNormal.pause());
  audioSubuh.play().then(()=>audioSubuh.pause());

  if(Notification.permission!=="granted"){
    Notification.requestPermission();
  }

  alert("Audio & Notifikasi Aktif");
});
