import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, FileText, Eye, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listTemplates, deleteTemplate } from '../services/templates';
import { renderFormPreview } from '../utils/templateFields';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const fetchTemplates = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await listTemplates({ search, page });
      setTemplates(response.data.data);
      setPagination(response.data);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTemplates(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchTemplates]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

    setDeletingId(id);
    try {
      await deleteTemplate(id);
      fetchTemplates(pagination?.current_page || 1);
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      alert('Erro ao excluir modelo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Modelo de Ficha de Avaliação" subtitle="Crie e gerencie modelos de avaliação">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <Link to="/modelos/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Modelo
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-muted">Carregando modelos...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark">Nenhum modelo encontrado</h3>
            <p className="text-slate-muted mt-1">
              {search ? 'Tente ajustar a busca.' : 'Crie seu primeiro modelo de ficha.'}
            </p>
            {!search && (
              <Link to="/modelos/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus className="w-4 h-4" />
                Criar Modelo
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Título
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Campos
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Versão
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-muted uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-dark">{template.title}</p>
                      {template.description && (
                        <p className="text-sm text-slate-muted truncate max-w-xs">{template.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">
                      {template.versions_count || 0} versão(ões)
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-body">v{template.current_version}</td>
                    <td className="py-3 px-4">
                      {template.is_active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="default">Inativo</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Pré-visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/modelos/${template.id}/editar`}
                          className="p-2 text-slate-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id}
                          className="p-2 text-slate-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-dark/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-border">
              <div>
                <h3 className="text-lg font-semibold text-slate-dark">{previewTemplate.title}</h3>
                {previewTemplate.description && (
                  <p className="text-sm text-slate-muted">{previewTemplate.description}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-muted hover:text-slate-dark hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {previewTemplate.fields && previewTemplate.fields.length > 0 ? (
                renderFormPreview(previewTemplate.fields)
              ) : (
                <p className="text-center text-slate-muted py-8">Este modelo não possui campos.</p>
              )}
            </div>
            <div className="p-5 border-t border-slate-border flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2.5 border border-slate-border rounded-lg text-slate-body hover:bg-slate-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
