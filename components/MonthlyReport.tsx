
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { User, TimeRecord } from '../types';
import { X, FileText, Eraser, Download, Loader2, Calendar } from 'lucide-react';

interface MonthlyReportProps {
  user: User;
  records: TimeRecord[];
  onClose: () => void;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ user, records, onClose }) => {
  const sigPad = useRef<SignatureCanvas>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const clearSignature = () => sigPad.current?.clear();

  const generatePDF = async () => {
    if (sigPad.current?.isEmpty()) {
      alert("Por favor, assine o documento antes de gerar o PDF.");
      return;
    }

    setIsGenerating(true);
    try {
      const doc = new jsPDF() as any;
      const signatureImg = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');

      const [year, month] = selectedMonth.split('-').map(Number);
      const filteredRecords = records.filter(r => {
        const d = new Date(r.timestamp);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      }).sort((a, b) => a.timestamp - b.timestamp);

      // Design do PDF
      doc.setFillColor(5, 5, 5);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("GeoPoint", 20, 20);
      doc.setFontSize(10);
      doc.text("FOLHA DE PONTO MENSAL - COMPROVANTE DIGITAL", 20, 28);
      
      doc.setTextColor(200, 200, 200);
      doc.text(`Mês: ${month}/${year}`, 150, 25);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Colaborador: ${user.name}`, 20, 50);
      doc.text(`Matrícula: ${user.employeeId}`, 20, 55);
      doc.text(`E-mail: ${user.email}`, 20, 60);
      doc.text(`Unidade: ${user.workspaceId}`, 150, 50);

      const tableData = filteredRecords.map(r => [
        new Date(r.timestamp).toLocaleDateString('pt-BR'),
        new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        r.type === 'entry' ? 'ENTRADA' : 'SAÍDA',
        r.locationName.split('(')[0]
      ]);

      (doc as any).autoTable({
        startY: 70,
        head: [['Data', 'Hora', 'Evento', 'Localização']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [45, 212, 191], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 70;
      if (finalY + 60 > 280) doc.addPage();
      
      const sigY = doc.internal.pageSize.height - 70;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("ASSINATURA DIGITAL DO COLABORADOR", 105, sigY - 5, { align: 'center' });
      doc.line(60, sigY, 150, sigY);
      
      if (signatureImg) {
        doc.addImage(signatureImg, 'PNG', 75, sigY - 25, 60, 20);
      }

      const protocol = `GP-PDF-${Date.now()}-${user.id.substring(0, 5)}`;
      doc.setFontSize(7);
      doc.text(`Autenticidade: ${protocol}`, 20, doc.internal.pageSize.height - 15);

      doc.save(`Folha_Ponto_${user.name.replace(/\s+/g, '_')}_${selectedMonth}.pdf`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao processar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-xl text-white">
              <FileText size={20} />
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white">Folha de Ponto Digital</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-[#2DD4BF]" /> Mês de Referência
            </label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-5 bg-[#121212] border border-white/5 rounded-2xl font-black text-white outline-none focus:border-[#2DD4BF]/50"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               Assinatura Digital
            </label>
            <div className="bg-white rounded-3xl overflow-hidden border-2 border-white/5 h-48 relative shadow-2xl">
              {/* @fix: Removed penColor="#000000" because it causes a type mismatch error in this environment, and black is the default. */}
              <SignatureCanvas 
                ref={sigPad}
                canvasProps={{ className: 'w-full h-full' }}
              />
              <button 
                onClick={clearSignature}
                className="absolute top-4 right-4 p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all shadow-md"
              >
                <Eraser size={18} />
              </button>
            </div>
            <p className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest italic opacity-50">Assine dentro do quadro acima</p>
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5">
          <button 
            disabled={isGenerating}
            onClick={generatePDF}
            className="w-full py-5 bg-gradient-to-r from-[#2DD4BF] to-[#4F46E5] text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGenerating ? "GERANDO RELATÓRIO..." : "BAIXAR PDF ASSINADO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
