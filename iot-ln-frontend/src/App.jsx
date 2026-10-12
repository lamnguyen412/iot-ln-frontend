import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Home,
  ChartColumn,
  History,
  UserCircle,
  LogOut,
  Search,
  Thermometer,
  Droplets,
  Lightbulb,
  LightbulbOff,
  Fan,
  Snowflake,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Save,
  Camera,
  IdCard,
  Phone,
  CalendarDays,
  ExternalLink,
  LogIn,
  LockKeyhole,
} from 'lucide-react';
import Chart from 'chart.js/auto';

import api, { DEMO, subscribe } from './api';
import { initialSensors, initialDevices, initialHistory, initialProfile } from './data';

// Tiện ích lưu trữ và định dạng dữ liệu.
function stored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function useStored(key, fallback) {
  const [value, set] = useState(() => stored(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, set];
}

const dateParts = (t) => {
  const d = new Date(t);
  return [d.toLocaleDateString('sv-SE'), d.toLocaleTimeString('en-GB')];
};

function Time({ value }) {
  const [day, time] = dateParts(value);

  return (
    <span className="time">
      {day}
      <strong>{time}</strong>
    </span>
  );
}

// Biểu đồ và danh sách thiết bị trên Dashboard.
function Graph({ rows }) {
  const canvas = useRef();

  useEffect(() => {
    const points = rows.slice(0, 11).reverse();
    const chart = new Chart(canvas.current, {
      type: 'line',
      data: {
        labels: points.map((r) => dateParts(r.time)),
        datasets: [
          ['Nhiệt độ (°C)', 'temperature', '#8045ff'],
          ['Độ ẩm (%)', 'humidity', '#2995fa'],
          ['Độ sáng (lux)', 'light', '#ffae20'],
        ].map(([label, key, color]) => ({
          label,
          data: points.map((r) => r[key]),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
              font: { size: 13 },
              color: '#858b9f',
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#f0f1f6' },
            ticks: {
              color: '#7f899f',
              maxTicksLimit: 6,
              padding: 8,
              font: { size: 12 },
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 300,
            ticks: {
              stepSize: 50,
              color: '#7f899f',
              padding: 8,
              font: { size: 12 },
            },
            grid: { color: '#f0f1f6' },
            border: { display: false },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [rows]);

  return (
    <div className="graph">
      <canvas ref={canvas} aria-label="Biểu đồ nhiệt độ, độ ẩm và ánh sáng" role="img" />
    </div>
  );
}

function Dashboard({ sensors, devices, toggle, busy }) {
  const last = sensors[0];

  return (
    <>
      <div className="stats">
        {[
          [Thermometer, 'Nhiệt độ', last?.temperature, '°C', 'purple'],
          [Droplets, 'Độ ẩm', last?.humidity, '%', 'green'],
          [Lightbulb, 'Độ sáng', last?.light, 'lux', 'orange'],
        ].map(([Icon, label, value, unit, color]) => (
          <div className="stat card" key={label}>
            <span className={`icon-tile ${color}`}>
              <Icon size={24} />
            </span>
            <div>
              <small>{label}</small>
              <div className="reading">
                {value ?? '—'} {unit}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <Graph rows={sensors} />
        </section>
        <section className="card devices">
          <h3>My Devices</h3>
          <div className="device-grid">
            {devices.map((d) => {
              const isLoading = busy === d.id;
              const ActiveIcon =
                d.kind === 'Fan' ? Fan : d.kind === 'Light' ? Lightbulb : Snowflake;
              const OffIcon =
                d.kind === 'Fan' ? Fan : d.kind === 'Light' ? LightbulbOff : Snowflake;
              const Icon = isLoading ? LoaderCircle : d.on ? ActiveIcon : OffIcon;
              const color = isLoading
                ? 'device-loading'
                : d.on
                ? d.kind === 'Fan'
                  ? 'blue'
                  : d.kind === 'Light'
                    ? 'orange'
                    : 'green'
                : 'device-off';

              return (
                <article className="device" key={d.id}>
                  <span
                    className={`device-icon ${color} ${isLoading ? 'spinning' : ''} ${!d.on && !isLoading && d.kind !== 'Light' ? 'off-mark' : ''}`}
                  >
                    <Icon size={25} />
                  </span>
                  <strong className="device-name">{d.name}</strong>
                  <span className={`device-status ${isLoading ? 'loading' : ''}`}>
                    {isLoading ? 'Đang tải...' : d.on ? 'Đang bật' : 'Đang tắt'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={d.on}
                    aria-label={`Bật/tắt ${d.name}`}
                    disabled={isLoading}
                    onClick={() => toggle(d)}
                    className={`switch ${d.on ? 'on' : ''}`}
                  >
                    <span />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();

    if (username.trim() === 'lamnguyen' && password === 'lamnguyen') {
      setError('');
      onLogin();
      return;
    }

    setError('Tên đăng nhập hoặc mật khẩu không đúng.');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">IOT LN</div>
        <div className="login-heading">
          <span className="login-icon">
            <LockKeyhole size={25} />
          </span>
          <h1>Đăng nhập</h1>
          <p>Đăng nhập để quản lý và theo dõi các thiết bị IoT.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            Tên đăng nhập
            <input
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError('');
              }}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-button" type="submit">
            <LogIn size={18} />
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}

// Bảng cảm biến và lịch sử điều khiển: tìm kiếm, sắp xếp, phân trang.
function DataTable({ type, rows, devices = [], userName = '' }) {
  const sensor = type === 'sensors';
  const statusLabels = {
    Success: 'Thành công',
    Failed: 'Thất bại',
    Pending: 'Đang tải',
  };
  const sensorTypes = [
    { key: 'temperature', name: 'Nhiệt độ', unit: '°C' },
    { key: 'humidity', name: 'Độ ẩm', unit: '%' },
    { key: 'light', name: 'Ánh sáng', unit: 'lux' },
  ];
  const historyIds = sensor
    ? null
    : new Map(
        [...rows]
          .sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
          .map((row, index) => [row.id, String(index + 1).padStart(3, '0')]),
      );

  const displayValue = (row, key) => {
    if (key === 'id') return sensor ? row.displayId : historyIds.get(row.id);
    if (key === 'device')
      return (
        (devices.find((d) => d.id === row[key]) ?? initialDevices.find((d) => d.id === row[key]))
          ?.name ?? row[key]
      );
    if (key === 'user') return row.user || userName || 'Nguyen Van A';
    if (key === 'status') return statusLabels[row[key]] ?? row[key];
    return row[key];
  };

  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [appliedField, setAppliedField] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState({
    device: 'all',
    action: 'all',
    status: 'all',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageInput, setPageInput] = useState('');
  const [sort, setSort] = useState({ key: sensor ? '' : 'id', dir: 1 });

  useEffect(
    () => setPage(1),
    [query, appliedField, appliedHistoryFilters],
  );

  const tableRows = sensor
    ? rows
        .flatMap((row) =>
          sensorTypes
            .filter(({ key }) => appliedField === 'all' || appliedField === key)
            .map(({ key, name, unit }) => ({
              id: `${row.id}-${key}`,
              sensorName: name,
              value: row[key],
              unit,
              time: row.time,
            })),
        )
        .map((row, index) => ({ ...row, displayId: String(index + 1).padStart(3, '0') }))
    : rows;
  const keys = sensor
    ? ['id', 'sensorName', 'value', 'time']
    : ['id', 'device', 'user', 'action', 'status', 'time'];
  const filtered = tableRows.filter((r) => {
    const matchesFilters =
      sensor ||
      ((appliedHistoryFilters.device === 'all' ||
        r.device === appliedHistoryFilters.device) &&
        (appliedHistoryFilters.action === 'all' ||
          r.action === appliedHistoryFilters.action) &&
        (appliedHistoryFilters.status === 'all' ||
          r.status === appliedHistoryFilters.status));
    const matchesQuery = keys.some((k) =>
      String(k === 'time' ? dateParts(r[k]).join(' ') : displayValue(r, k))
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

    return matchesFilters && matchesQuery;
  });

  if (sort.key)
    filtered.sort((a, b) => {
      const left = displayValue(a, sort.key);
      const right = displayValue(b, sort.key);

      return (
        (typeof left === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'vi', { numeric: true })) * sort.dir
      );
    });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visiblePages = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (number) => number === 1 || number === pages || Math.abs(number - current) <= 1,
  );
  const headers = sensor
    ? ['ID', 'Tên cảm biến', 'Giá trị', 'Thời gian']
    : ['ID', 'Thiết bị', 'Người dùng', 'Hành động', 'Trạng thái', 'Thời gian'];

  return (
    <>
      <form
        className="search-row"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input.trim());
          setAppliedField(field);
          setAppliedHistoryFilters({
            device: deviceFilter,
            action: actionFilter,
            status: statusFilter,
          });
          setPage(1);
        }}
      >
        <label className="search-box">
          <Search size={17} />
          <input
            placeholder="Nhập giá trị cần tìm..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Tìm kiếm"
          />
        </label>
        {sensor && (
          <select
            className="sensor-filter"
            aria-label="Loại cảm biến"
            value={field}
            onChange={(e) => setField(e.target.value)}
          >
            <option value="all">Mọi cảm biến</option>
            <option value="temperature">Nhiệt độ</option>
            <option value="humidity">Độ ẩm</option>
            <option value="light">Ánh sáng</option>
          </select>
        )}
        {!sensor && (
          <div className="history-filters">
            <select
              aria-label="Lọc theo thiết bị"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="all">Mọi thiết bị</option>
              {devices.map((device) => (
                <option value={device.id} key={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc theo hành động"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">Mọi hành động</option>
              <option value="Bật">Bật</option>
              <option value="Tắt">Tắt</option>
            </select>
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Mọi trạng thái</option>
              <option value="Success">Thành công</option>
              <option value="Failed">Thất bại</option>
              <option value="Pending">Đang tải</option>
            </select>
          </div>
        )}
        <button className="primary">Tìm kiếm</button>
      </form>
      <section className={`card table-card ${sensor ? 'sensor-table' : 'history-table'}`}>
        <h3>{sensor ? 'Lịch sử dữ liệu cảm biến' : 'Lịch sử điều khiển'}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={h}>
                    <button
                      onClick={() =>
                        setSort({ key: keys[i], dir: sort.key === keys[i] ? -sort.dir : 1 })
                      }
                    >
                      {h}
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice((current - 1) * pageSize, current * pageSize).map((r) => (
                <tr key={r.id}>
                  {keys.map((k) => (
                    <td
                      key={k}
                      className={
                        k === 'id'
                          ? 'id'
                          : k === 'value'
                            ? 'sensor-value'
                            : ''
                      }
                    >
                      {k === 'time' ? (
                        <Time value={r[k]} />
                      ) : k === 'status' ? (
                        <span
                          className={`badge ${
                            r[k] === 'Success'
                              ? 'success'
                              : r[k] === 'Pending'
                                ? 'pending'
                                : 'failed'
                          }`}
                        >
                          {displayValue(r, k)}
                        </span>
                      ) : (
                        <>
                          {displayValue(r, k)}
                          {sensor && k === 'value' ? ` ${r.unit}` : ''}
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={keys.length} className="empty">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="pagination">
        <div className="pagination-info">
          <label>
            Hiển thị
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
                setPageInput('');
              }}
              aria-label="Số dòng mỗi trang"
            >
              {[6, 10, 15, 20].map((size) => (
                <option value={size} key={size}>
                  {size} dòng
                </option>
              ))}
            </select>
          </label>
          <span>{filtered.length} bản ghi</span>
        </div>
        <button
          disabled={current === 1}
          onClick={() => setPage(current - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={14} />
        </button>
        {visiblePages.map((number, index) => (
          <React.Fragment key={number}>
            {index > 0 && number - visiblePages[index - 1] > 1 && (
              <span className="page-gap">…</span>
            )}
            <button
              className={number === current ? 'selected' : ''}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          </React.Fragment>
        ))}
        <form
          className="page-jump"
          onSubmit={(e) => {
            e.preventDefault();
            const destination = Number(pageInput);
            if (Number.isInteger(destination) && destination >= 1 && destination <= pages) {
              setPage(destination);
              setPageInput('');
            }
          }}
        >
          <input
            type="number"
            min="1"
            max={pages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="Trang"
            aria-label="Đi đến trang"
          />
          <button type="submit" className="go-page">
            Đi
          </button>
        </form>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
}

// Hồ sơ người dùng và ảnh đại diện.
function Profile({ profile, setProfile, notify }) {
  const savedProfile = { ...initialProfile, ...profile };
  const [draft, setDraft] = useState(savedProfile);

  async function submit(e) {
    e.preventDefault();
    const updatedProfile = { ...initialProfile, ...draft };
    try {
      if (!DEMO) await api.put('/profile', updatedProfile);
      setProfile(updatedProfile);
      notify('Đã lưu thông tin cá nhân.');
    } catch {
      notify('Lưu thất bại. Vui lòng kiểm tra kết nối backend.');
    }
  }

  function avatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      notify('Chọn ảnh PNG/JPG/WebP nhỏ hơn 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, avatar: reader.result });
    reader.readAsDataURL(file);
  }

  return (
    <section className="card profile-card">
      <aside className="profile-summary">
        <div className="avatar">
          {draft.avatar ? (
            <img src={draft.avatar} alt="Ảnh đại diện" />
          ) : (
            draft.name.trim().slice(-1).toUpperCase() || 'A'
          )}
        </div>
        <label className="avatar-edit">
          <Camera size={12} /> Đổi ảnh đại diện
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={avatar} />
        </label>
        <h3>{savedProfile.name}</h3>
        <div className="profile-details">
          <span>
            <IdCard size={14} /> {savedProfile.studentId || 'Chưa có mã sinh viên'}
          </span>
          <span>
            <Phone size={14} /> {savedProfile.phone || 'Chưa có số điện thoại'}
          </span>
          <span>
            <CalendarDays size={14} />
            {savedProfile.birthday
              ? new Date(`${savedProfile.birthday}T00:00:00`).toLocaleDateString('vi-VN')
              : 'Chưa có ngày sinh'}
          </span>
        </div>
        <div className="profile-links">
          {[
            ['Figma', savedProfile.figmaUrl],
            ['GitHub', savedProfile.githubUrl],
            ['File PDF', savedProfile.pdfUrl],
            ['Postman', savedProfile.postmanUrl],
          ].map(
            ([label, url]) =>
              url && (
                <a href={url} target="_blank" rel="noreferrer" key={label}>
                  <ExternalLink size={13} /> {label}
                </a>
              ),
          )}
        </div>
      </aside>
      <form className="profile-form" onSubmit={submit}>
        <div className="section-title">
          <h3>Thông tin cá nhân</h3>
          <UserCircle size={18} />
        </div>
        <p>Cập nhật thông tin tài khoản của bạn</p>
        <div className="fields">
          {[
            ['name', 'Họ và tên', 'text', true, 'Nhập họ và tên'],
            ['studentId', 'Mã sinh viên', 'text', true, 'Nhập mã sinh viên'],
            ['phone', 'Số điện thoại', 'tel', true, 'Nhập số điện thoại'],
            ['birthday', 'Ngày sinh', 'date', true, ''],
            ['figmaUrl', 'Link Figma', 'url', false, 'https://figma.com/...'],
            ['githubUrl', 'Link GitHub', 'url', false, 'https://github.com/...'],
            ['pdfUrl', 'Link file PDF', 'url', false, 'https://...'],
            ['postmanUrl', 'Link Postman', 'url', false, 'https://...'],
          ].map(([key, label, type, required, placeholder]) => (
            <label key={key}>
              {label}
              <input
                required={required}
                type={type}
                value={draft[key] ?? ''}
                placeholder={placeholder}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <button className="primary">
          <Save size={14} /> Lưu thay đổi
        </button>
      </form>
    </section>
  );
}

// Dữ liệu ứng dụng, kết nối backend và điều hướng các trang.
export default function App() {
  const [sensors, setSensors] = useState(DEMO ? initialSensors : []);
  const [devices, setDevices] = useStored(
    DEMO ? 'iot-devices' : 'iot-live-devices',
    DEMO ? initialDevices : [],
  );
  const [history, setHistory] = useStored(
    DEMO ? 'iot-history' : 'iot-live-history',
    DEMO ? initialHistory : [],
  );
  const [profile, setProfile] = useStored('iot-profile', initialProfile);

  const [message, notify] = useState('');
  const [busy, setBusy] = useState('');
  const [loggedIn, setLoggedIn] = useStored('iot-authenticated', false);
  const location = useLocation();

  useEffect(() => {
    if (!DEMO) return;
    setHistory((old) => {
      const samples = new Map(initialHistory.map((row) => [row.id, row]));
      const migrated = old.map((row) => {
        const sample = samples.get(row.id);
        if (!sample) return row;
        return { ...row, user: sample.user, status: sample.status };
      });
      const knownIds = new Set(old.map((row) => row.id));
      const missing = initialHistory.filter((row) => !knownIds.has(row.id));
      return [...migrated, ...missing];
    });
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => notify(''), 5000);
    return () => clearTimeout(id);
  }, [message]);

  useEffect(() => {
    if (DEMO) return;
    let active = true;
    Promise.all([
      api.get('/sensors'),
      api.get('/devices'),
      api.get('/actions'),
      api.get('/profile'),
    ])
      .then(([s, d, h, p]) => {
        if (active) {
          setSensors(s.data);
          setDevices(d.data);
          setHistory(h.data);
          setProfile(p.data);
        }
      })
      .catch(() => {
        if (active) notify('Không tải được dữ liệu từ backend. Kiểm tra URL API và CORS.');
      });
    const stop = subscribe((msg) => {
      if (
        msg.type === 'sensor' &&
        msg.data?.id &&
        Number.isFinite(msg.data.temperature) &&
        Number.isFinite(msg.data.humidity) &&
        Number.isFinite(msg.data.light) &&
        Number.isFinite(Date.parse(msg.data.time))
      )
        setSensors((old) => [msg.data, ...old.filter((r) => r.id !== msg.data.id)].slice(0, 1000));
      if (msg.type === 'device' && msg.data?.id)
        setDevices((old) => old.map((d) => (d.id === msg.data.id ? { ...d, ...msg.data } : d)));
    });
    return () => {
      active = false;
      stop();
    };
  }, []);

  async function toggle(d) {
    if (busy) return;
    setBusy(d.id);
    try {
      await Promise.all([
        DEMO
          ? Promise.resolve()
          : api.patch(`/devices/${encodeURIComponent(d.id)}`, { on: !d.on }),
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]);
      setDevices((old) => old.map((x) => (x.id === d.id ? { ...x, on: !d.on } : x)));
      setHistory((old) => [
        {
          id: `ACT-${Date.now()}`,
          device: d.id,
          user: DEMO ? 'lamnguyen' : profile.username || profile.name,
          action: d.on ? 'Tắt' : 'Bật',
          status: 'Success',
          time: new Date().toISOString(),
        },
        ...old,
      ]);
    } catch {
      notify('Điều khiển thất bại. Kiểm tra backend và thiết bị.');
    } finally {
      setBusy('');
    }
  }

  const nav = [
    ['/', 'Dashboard', Home],
    ['/sensors', 'Data Sensor', ChartColumn],
    ['/history', 'Action History', History],
    ['/profile', 'Profile', UserCircle],
  ];
  const sampleHistoryIds = new Set(initialHistory.map((row) => row.id));
  const historyRows = DEMO
    ? [...history.filter((row) => !sampleHistoryIds.has(row.id)), ...initialHistory]
    : history;
  const title = nav.find((n) => n[0] === location.pathname)?.[1] || 'Dashboard';
  const subtitles = {
    Profile: 'Thông tin tài khoản người dùng',
  };

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">IOT LN</div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="nav-bottom">
          <button onClick={() => setLoggedIn(false)}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className={location.pathname === '/' ? 'dashboard-main' : undefined}>
        <NavLink to="/profile" className="profile-account" aria-label="Mở trang cá nhân">
          <span>{profile.name}</span>
          <span className="mini-avatar">
            {profile.avatar ? <img src={profile.avatar} alt="Ảnh đại diện" /> : profile.name.slice(-1)}
          </span>
        </NavLink>
        <header>
          <div>
            <h1>{title}</h1>
            {subtitles[title] && <p>{subtitles[title]}</p>}
          </div>
        </header>
        <Routes>
          <Route
            path="/"
            element={<Dashboard sensors={sensors} devices={devices} toggle={toggle} busy={busy} />}
          />
          <Route
            path="/sensors"
            element={<DataTable key="sensors" type="sensors" rows={sensors} />}
          />
          <Route
            path="/history"
            element={
              <DataTable
                key="history"
                type="history"
                rows={DEMO ? historyRows : historyRows.slice(0, 72)}
                devices={devices}
                userName={DEMO ? 'lamnguyen' : profile.username || profile.name}
              />
            }
          />
          <Route
            path="/profile"
            element={<Profile profile={profile} setProfile={setProfile} notify={notify} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {message && (
        <div className="toast" role="status">
          {message}
          <button onClick={() => notify('')} aria-label="Đóng">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
