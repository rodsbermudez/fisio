import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { listRooms } from '../services/rooms';
import { listProfessionals } from '../services/users';
import { getCalendarAppointments, rescheduleAppointment } from '../services/appointments';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const SCHEDULE_STATE_KEY = 'schedule_state';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop(Calendar);

const messages = {
  today: 'Hoje',
  previous: 'Anterior',
  next: 'Próximo',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há atendimentos neste período.',
  showMore: (total) => `+${total} mais`,
};

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date();
  return parseISO(`${dateStr}T${timeStr}`);
}

function getDefaultState(user) {
  const isTherapist = user?.role === 'therapist';
  return {
    view: Views.WEEK,
    date: new Date(),
    roomFilter: '',
    professionalFilter: isTherapist && user?.id ? String(user.id) : '',
    myAgendaMode: isTherapist,
  };
}

function getInitialState(user) {
  const defaults = getDefaultState(user);

  try {
    const saved = sessionStorage.getItem(SCHEDULE_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Se o tenant mudou (ex: impersonando outro cliente) ou não há tenant salvo,
      // descarta filtros salvos para evitar IDs "fantasmas".
      if (parsed.tenantId !== user?.tenant_id) {
        return defaults;
      }
      return {
        view: parsed.view || defaults.view,
        date: parsed.date ? new Date(parsed.date) : defaults.date,
        roomFilter: parsed.roomFilter ?? defaults.roomFilter,
        professionalFilter: parsed.professionalFilter ?? defaults.professionalFilter,
        myAgendaMode: typeof parsed.myAgendaMode === 'boolean' ? parsed.myAgendaMode : defaults.myAgendaMode,
      };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export default function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialState = useMemo(() => getInitialState(user), [user]);

  const isOwner = user?.role === 'owner';

  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [view, setView] = useState(initialState.view);
  const [date, setDate] = useState(initialState.date);
  const [roomFilter, setRoomFilter] = useState(initialState.roomFilter);
  const [professionalFilter, setProfessionalFilter] = useState(initialState.professionalFilter);
  const [myAgendaMode, setMyAgendaMode] = useState(initialState.myAgendaMode);

  // Valida o filtro de sala ao carregar: se o valor salvo não existir na lista,
  // cai para a primeira sala. Isso evita IDs "fantasmas" de outros tenants/sessões.
  useEffect(() => {
    if (rooms.length === 0) return;
    const exists = rooms.some((r) => String(r.id) === String(roomFilter));
    if (!exists) {
      setRoomFilter(String(rooms[0].id));
    }
  }, [rooms, roomFilter]);

  useEffect(() => {
    const state = {
      tenantId: user?.tenant_id,
      view,
      date: date.toISOString(),
      roomFilter,
      professionalFilter,
      myAgendaMode,
    };
    sessionStorage.setItem(SCHEDULE_STATE_KEY, JSON.stringify(state));
  }, [view, date, roomFilter, professionalFilter, myAgendaMode, user?.tenant_id]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await listRooms({ per_page: 1000 });
        setRooms(response.data.data || []);
      } catch (error) {
        console.error('Erro ao carregar salas:', error);
      }
    };

    const loadProfessionals = async () => {
      try {
        const response = await listProfessionals();
        setProfessionals(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
      }
    };

    loadRooms();
    loadProfessionals();
  }, []);

  // Therapist: "Minha agenda" controla se vê só os próprios ou a sala inteira
  useEffect(() => {
    if (isOwner || !user) return;
    const target = myAgendaMode ? String(user.id) : '';
    if (professionalFilter !== target) {
      setProfessionalFilter(target);
    }
  }, [myAgendaMode, isOwner, user, professionalFilter]);

  // My agenda mode toggles the professional filter for owners
  useEffect(() => {
    if (!isOwner || !user) return;
    if (myAgendaMode && professionalFilter !== String(user.id)) {
      setProfessionalFilter(String(user.id));
    } else if (!myAgendaMode && professionalFilter === String(user.id)) {
      setProfessionalFilter('');
    }
  }, [myAgendaMode, isOwner, user, professionalFilter]);

  // Se o profissional salvo não existir na lista carregada, reseta para o padrão
  useEffect(() => {
    if (professionals.length === 0) return;
    const exists = professionals.some((p) => String(p.id) === String(professionalFilter));
    if (exists) return;

    if (isOwner) {
      setProfessionalFilter('');
      setMyAgendaMode(false);
    } else if (user?.id) {
      setProfessionalFilter(String(user.id));
      setMyAgendaMode(true);
    } else {
      setProfessionalFilter('');
    }
  }, [professionals, professionalFilter, isOwner, user]);

  const loadAppointments = useCallback(async () => {
    try {
      let from;
      let to;
      if (view === Views.MONTH) {
        from = format(startOfMonth(date), 'yyyy-MM-dd');
        to = format(endOfMonth(date), 'yyyy-MM-dd');
      } else if (view === Views.WEEK) {
        from = format(startOfWeek(date, { locale: ptBR }), 'yyyy-MM-dd');
        to = format(endOfWeek(date, { locale: ptBR }), 'yyyy-MM-dd');
      } else {
        from = format(date, 'yyyy-MM-dd');
        to = format(date, 'yyyy-MM-dd');
      }
      const params = { from, to };
      if (roomFilter) params.room_id = roomFilter;
      if (professionalFilter) params.professional_id = professionalFilter;

      const response = await getCalendarAppointments(params);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
    }
  }, [date, view, roomFilter, professionalFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const occupancyMap = useMemo(() => {
    const map = {};
    appointments.forEach((app) => {
      const key = `${app.appointment_date}|${app.start_time}|${app.room_id}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [appointments]);

  const events = useMemo(() => {
    return appointments.map((app) => {
      const start = parseDateTime(app.appointment_date, app.start_time);
      const end = new Date(start.getTime() + (app.duration_minutes || 60) * 60000);
      const room = rooms.find((r) => r.id === app.room_id);
      const capacity = room?.capacity || 1;
      const key = `${app.appointment_date}|${app.start_time}|${app.room_id}`;
      const occupied = occupancyMap[key] || 1;
      const isMine = app.is_mine;
      const canViewDetails = app.can_view_details && (!myAgendaMode || isMine);

      return {
        id: app.id,
        title: canViewDetails ? app.patient?.name || 'Atendimento' : 'Ocupado',
        start,
        end,
        resourceId: app.room_id,
        appointment: app,
        occupancy: `${occupied}/${capacity}`,
        isMine,
        canViewDetails,
        roomColor: room?.color || '#3b82f6',
        roomName: room?.name || '',
        serviceTypeName: app.service_type?.name || '',
        professionalName: app.professional?.name || '',
        status: app.status,
      };
    });
  }, [appointments, rooms, occupancyMap, myAgendaMode]);

  const resources = useMemo(() => {
    const visibleRooms = roomFilter
      ? rooms.filter((room) => String(room.id) === String(roomFilter))
      : rooms;

    return visibleRooms.map((room) => ({
      id: room.id,
      title: room.name,
      capacity: room.capacity,
    }));
  }, [rooms, roomFilter]);

  const handleEventDrop = async ({ event, start, resourceId }) => {
    const app = event.appointment;
    const roomId = resourceId || app.room_id;
    const appointmentDate = format(start, 'yyyy-MM-dd');
    const startTime = format(start, 'HH:mm');

    try {
      await rescheduleAppointment(app.id, {
        room_id: roomId,
        appointment_date: appointmentDate,
        start_time: startTime,
      });
      loadAppointments();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erro ao remarcar atendimento.');
    }
  };

  const handleSelectEvent = (event) => {
    if (event.canViewDetails) {
      navigate(`/atendimentos/${event.id}?from=schedule`);
    }
  };

  const eventStyleGetter = (event) => {
    const isBusy = !event.canViewDetails;
    return {
      style: {
        backgroundColor: isBusy ? '#E2E8F0' : event.roomColor,
        borderRadius: '6px',
        opacity: event.status === 'cancelled' || event.status === 'missed' ? 0.6 : 1,
        color: isBusy ? '#475569' : '#fff',
        border: isBusy ? '1px dashed #94A3B8' : 'none',
        fontSize: '12px',
      },
    };
  };

  const EventComponent = ({ event }) => {
    return (
      <div className="flex flex-col leading-tight">
        <span className="font-medium truncate">{event.title}</span>
        {event.professionalName && (
          <span className="text-[10px] opacity-90 truncate">{event.professionalName}</span>
        )}
        <span className="text-[10px] opacity-90 truncate">
          {event.serviceTypeName} · {event.roomName} · {event.occupancy}
        </span>
      </div>
    );
  };

  EventComponent.propTypes = {
    event: PropTypes.shape({
      title: PropTypes.string,
      serviceTypeName: PropTypes.string,
      roomName: PropTypes.string,
      professionalName: PropTypes.string,
      occupancy: PropTypes.string,
    }).isRequired,
  };

  const CustomToolbar = ({ label, onNavigate }) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-border bg-white text-slate-body hover:bg-slate-50"
          >
            Próximo
          </button>
        </div>
        <span className="text-sm font-medium text-slate-dark capitalize">{label}</span>
        <div />
      </div>
    );
  };

  CustomToolbar.propTypes = {
    label: PropTypes.string,
    onNavigate: PropTypes.func,
  };

  return (
    <Layout title="Agenda" subtitle="Visualize e gerencie os atendimentos">
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>

            {isOwner && (
              <select
                value={professionalFilter}
                onChange={(e) => setProfessionalFilter(e.target.value)}
                className="input-field w-auto min-w-[160px]"
              >
                <option value="">Todos os profissionais</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-border rounded-lg px-3 py-2">
              <span className="text-sm text-slate-body">Minha agenda</span>
              <button
                type="button"
                onClick={() => setMyAgendaMode((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  myAgendaMode ? 'bg-brand' : 'bg-slate-border'
                }`}
                title={myAgendaMode ? 'Mostrando apenas meus atendimentos' : 'Mostrando a ocupação da sala'}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    myAgendaMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!isOwner && !myAgendaMode && (
              <span className="text-xs text-slate-muted flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-slate-200 border border-dashed border-slate-400" />
                Ocupado (outro profissional)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'day', label: 'Dia' },
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mês' },
              { key: 'agenda', label: 'Lista' },
            ].map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  view === v.key
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-slate-body border-slate-border hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[calc(100vh-220px)] min-h-[600px] schedule-calendar">
          <DragAndDropCalendar
            localizer={localizer}
            culture="pt-BR"
            messages={messages}
            events={events}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            resources={view === 'day' ? resources : undefined}
            resourceIdAccessor={view === 'day' ? 'id' : undefined}
            resourceTitleAccessor={view === 'day' ? 'title' : undefined}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            onEventDrop={handleEventDrop}
            onSelectEvent={handleSelectEvent}
            draggableAccessor={(event) => event.canViewDetails}
            selectable
            step={30}
            timeslots={1}
          />
        </div>
      </div>
    </Layout>
  );
}
