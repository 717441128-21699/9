import { useState, useCallback } from 'react';
import {
  Upload,
  FileUp,
  Map,
  Layers,
  CloudRain,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings2,
  Play,
  Download,
  Info,
  FileType as FileTypeIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { cn, formatFileSize, generateId } from '@/utils/format';
import type { UploadedFile, FileType, ModelParameters } from '@/types';
import { useNavigate } from 'react-router-dom';

interface FileConfig {
  type: FileType;
  label: string;
  icon: typeof Map;
  description: string;
  formats: string[];
  required: boolean;
}

const fileConfigs: FileConfig[] = [
  {
    type: 'dem',
    label: 'DEM 数字高程模型',
    icon: Map,
    description: '支持 GeoTIFF、IMG 格式，分辨率 10-90m',
    formats: ['.tif', '.tiff', '.img'],
    required: true,
  },
  {
    type: 'soil',
    label: '土壤类型分布',
    icon: Layers,
    description: '支持 Shapefile、GeoJSON 格式',
    formats: ['.shp', '.geojson', '.json'],
    required: true,
  },
  {
    type: 'rainfall',
    label: '逐小时降雨序列',
    icon: CloudRain,
    description: '支持 CSV、XLSX 格式，包含时间戳和雨量',
    formats: ['.csv', '.xlsx', '.xls'],
    required: true,
  },
];

export function DataUpload() {
  const navigate = useNavigate();
  const addNewTask = useAppStore((s) => s.addNewTask);
  const [files, setFiles] = useState<Record<FileType, UploadedFile | null>>({
    dem: null,
    soil: null,
    rainfall: null,
  });
  const [draggingType, setDraggingType] = useState<FileType | null>(null);
  const [taskName, setTaskName] = useState('');
  const [basinName, setBasinName] = useState('');
  const [basinArea, setBasinArea] = useState('');
  const [returnPeriod, setReturnPeriod] = useState('10');
  const [autoParams, setAutoParams] = useState(true);
  const [params, setParams] = useState<ModelParameters>({
    demResolution: 30,
    soilType: '壤土',
    cnValue: 75,
    initialLoss: 10,
    recessionCoefficient: 0.92,
    routingVelocity: 2.0,
    manningN: 0.04,
  });

  const handleDrop = useCallback(
    (type: FileType, e: React.DragEvent) => {
      e.preventDefault();
      setDraggingType(null);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFiles((prev) => ({
          ...prev,
          [type]: {
            id: generateId(),
            name: file.name,
            type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'validated',
          },
        }));
      }
    },
    []
  );

  const handleFileSelect = (type: FileType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [type]: {
          id: generateId(),
          name: file.name,
          type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          status: 'validated',
        },
      }));
    }
  };

  const removeFile = (type: FileType) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
  };

  const allFilesUploaded = files.dem && files.soil && files.rainfall;
  const canSubmit = allFilesUploaded && taskName && basinName && basinArea;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addNewTask({
      name: taskName,
      basinName,
      basinArea: Number(basinArea),
      rainfallReturnPeriod: Number(returnPeriod),
      files: Object.values(files).filter(Boolean) as UploadedFile[],
      parameters: autoParams ? undefined : params,
    });
    navigate('/tasks');
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-white">数据上传与模型构建</h1>
        <p className="text-sm text-slate-400 mt-1">
          上传流域基础数据，系统将自动构建分布式水文模型并初始化参数
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="section-title">
              <FileUp className="w-4 h-4 text-hydra-400" />
              基础信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">任务名称 <span className="text-alert-red">*</span></label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="如：嘉陵江流域2026-06洪水模拟"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">流域名称 <span className="text-alert-red">*</span></label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="如：长江流域-嘉陵江段"
                  value={basinName}
                  onChange={(e) => setBasinName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">流域面积 (km²) <span className="text-alert-red">*</span></label>
                <input
                  type="number"
                  className="input-base font-mono"
                  placeholder="15600"
                  value={basinArea}
                  onChange={(e) => setBasinArea(e.target.value)}
                />
              </div>
              <div>
                <label className="label">降雨重现期</label>
                <select
                  className="input-base"
                  value={returnPeriod}
                  onChange={(e) => setReturnPeriod(e.target.value)}
                >
                  <option value="5">5年一遇</option>
                  <option value="10">10年一遇</option>
                  <option value="20">20年一遇</option>
                  <option value="50">50年一遇</option>
                  <option value="100">100年一遇</option>
                </select>
              </div>
            </div>
          </div>

          {fileConfigs.map((config) => (
            <FileUploadZone
              key={config.type}
              config={config}
              file={files[config.type]}
              isDragging={draggingType === config.type}
              onDragEnter={() => setDraggingType(config.type)}
              onDragLeave={() => setDraggingType(null)}
              onDrop={(e) => handleDrop(config.type, e)}
              onFileSelect={(e) => handleFileSelect(config.type, e)}
              onRemove={() => removeFile(config.type)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                <Settings2 className="w-4 h-4 text-hydra-400" />
                模型参数
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoParams}
                  onChange={(e) => setAutoParams(e.target.checked)}
                  className="w-3.5 h-3.5 accent-hydra-500"
                />
                自动初始化参数
              </label>
            </div>

            <div className="space-y-3">
              <ParamField
                label="DEM分辨率 (m)"
                value={params.demResolution}
                onChange={(v) => setParams({ ...params, demResolution: v })}
                disabled={autoParams}
              />
              <div>
                <label className="label">土壤类型</label>
                <select
                  className={cn('input-base', autoParams && 'opacity-50 cursor-not-allowed')}
                  value={params.soilType}
                  onChange={(e) => setParams({ ...params, soilType: e.target.value })}
                  disabled={autoParams}
                >
                  <option>砂土</option>
                  <option>砂壤土</option>
                  <option>壤土</option>
                  <option>粉砂壤土</option>
                  <option>粘土</option>
                </select>
              </div>
              <ParamField
                label="SCS-CN值"
                value={params.cnValue}
                onChange={(v) => setParams({ ...params, cnValue: v })}
                disabled={autoParams}
                step={0.1}
              />
              <ParamField
                label="初损 Ia (mm)"
                value={params.initialLoss}
                onChange={(v) => setParams({ ...params, initialLoss: v })}
                disabled={autoParams}
                step={0.1}
              />
              <ParamField
                label="退水系数 K"
                value={params.recessionCoefficient}
                onChange={(v) => setParams({ ...params, recessionCoefficient: v })}
                disabled={autoParams}
                step={0.001}
              />
              <ParamField
                label="汇流速度 (m/s)"
                value={params.routingVelocity}
                onChange={(v) => setParams({ ...params, routingVelocity: v })}
                disabled={autoParams}
                step={0.1}
              />
              <ParamField
                label="曼宁糙率 n"
                value={params.manningN}
                onChange={(v) => setParams({ ...params, manningN: v })}
                disabled={autoParams}
                step={0.001}
              />
            </div>

            {autoParams && (
              <div className="mt-4 p-3 rounded-md bg-hydra-500/10 border border-hydra-500/20">
                <div className="flex items-start gap-2 text-xs text-hydra-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    系统将根据上传的DEM和土壤数据自动计算最优参数。您也可关闭自动模式手动调整。
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              数据校验进度
            </h3>
            <div className="space-y-3">
              {fileConfigs.map((c) => (
                <div key={c.type} className="flex items-center gap-3">
                  {files[c.type] ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-surface-muted" />
                  )}
                  <span className={cn('text-sm', files[c.type] ? 'text-slate-300' : 'text-slate-500')}>
                    {c.label}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                {taskName && basinName && basinArea ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-surface-muted" />
                )}
                <span className={cn('text-sm', taskName && basinName && basinArea ? 'text-slate-300' : 'text-slate-500')}>
                  基础信息填写
                </span>
              </div>
            </div>

            <div className="divider" />

            <Progress
              value={
                (Object.values(files).filter(Boolean).length / 3) * 60 +
                (taskName ? 10 : 0) +
                (basinName ? 10 : 0) +
                (basinArea ? 10 : 0) +
                (returnPeriod ? 10 : 0)
              }
              showLabel
            />

            <div className="mt-4 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  'btn-primary w-full',
                  !canSubmit && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Play className="w-4 h-4" />
                开始构建模型并运行模拟
              </button>
              <button className="btn-secondary w-full">
                <Download className="w-4 h-4" />
                下载数据模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadZone({
  config,
  file,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemove,
}: {
  config: FileConfig;
  file: UploadedFile | null;
  isDragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const Icon = config.icon;

  if (file) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white truncate">{file.name}</p>
              <Badge variant="green">已校验</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span>{config.label}</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost !px-2 !py-1.5" title="预览">
              <FileTypeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="btn-ghost !px-2 !py-1.5 text-slate-400 hover:text-alert-red"
              title="移除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'card p-6 border-2 border-dashed transition-all cursor-pointer',
        isDragging
          ? 'border-hydra-500 bg-hydra-500/5 shadow-glow-sm'
          : 'border-surface-border hover:border-hydra-500/50'
      )}
    >
      <label className="flex items-start gap-4 cursor-pointer">
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center transition-all',
            isDragging
              ? 'bg-hydra-500/20 text-hydra-300'
              : 'bg-surface-elevated text-slate-400'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{config.label}</p>
            {config.required && (
              <span className="text-xs text-alert-red">必填</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{config.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Upload className="w-3.5 h-3.5 text-hydra-400" />
            <span className="text-xs text-hydra-300">
              拖拽文件到此处，或点击选择
            </span>
            <span className="text-xs text-slate-500">
              ({config.formats.join(', ')})
            </span>
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          accept={config.formats.join(',')}
          onChange={onFileSelect}
        />
      </label>
    </div>
  );
}

function ParamField({
  label,
  value,
  onChange,
  disabled,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        step={step}
        className={cn('input-base font-mono', disabled && 'opacity-50 cursor-not-allowed')}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
