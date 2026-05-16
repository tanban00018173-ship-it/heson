import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const statusConfig = {
  '待確認': { label: '待確認', bg: 'bg-amber-100 text-amber-700' },
  '已確認': { label: '已確認', bg: 'bg-blue-100 text-blue-700' },
  '已完成': { label: '已完成', bg: 'bg-emerald-100 text-emerald-700' },
  '已取消': { label: '已取消', bg: 'bg-stone-100 text-stone-500' },
};

export default function ClientDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/ClientProfile', { replace: true });
  }, []);

  return null;
}