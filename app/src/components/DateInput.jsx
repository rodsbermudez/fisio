import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import 'react-datepicker/dist/react-datepicker.css';

const CustomInput = forwardRef(function CustomInput({ value, onClick, onChange }, ref) {
  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted pointer-events-none" />
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={value}
        onClick={onClick}
        onChange={onChange}
        className="input-field w-full pl-10"
      />
    </div>
  );
});

export default function DateInput({ label, value, onChange }) {
  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const handleChange = (date) => {
    onChange(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '');
  };

  return (
    <div>
      {label && <label className="label-base">{label}</label>}
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        locale={ptBR}
        placeholderText="dd/mm/aaaa"
        customInput={<CustomInput />}
        isClearable={false}
        showPopperArrow={false}
      />
    </div>
  );
}

CustomInput.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func,
  onChange: PropTypes.func,
};

DateInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
