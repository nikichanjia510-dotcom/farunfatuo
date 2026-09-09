export type PlayableRoleId = 'teacher' | 'parent' | 'inspector' | 'prosecutor';

export interface CareerCard {
  id: string;
  name: string;
  emoji: string;
  perspective: string;
  duty: string;
  legalTopic: string;
  rarity: '稀有' | '史诗' | '传说' | '预览';
  playable: boolean;
  conditional?: boolean;
}

export interface CaseItem {
  id: string;
  label: string;
  detail?: string;
  recommended?: boolean;
}

export interface DecisionOption {
  id: string;
  label: string;
  recommended: boolean;
  feedback: string;
  ending?: string;
  unlockProsecutor?: boolean;
}

export type CaseStepKind =
  | 'briefing'
  | 'evidence'
  | 'checklist'
  | 'decision'
  | 'review'
  | 'branch'
  | 'document';

export interface CaseStep {
  id: string;
  kind: CaseStepKind;
  kicker: string;
  title: string;
  story: string;
  sceneEmoji: string;
  items?: CaseItem[];
  options?: DecisionOption[];
  prompt?: string;
  successText?: string;
  actionLabel?: string;
  evidenceToAdd?: CaseItem[];
  legalNote?: string;
  documentTitle?: string;
  documentLines?: string[];
}

export const careerCards: CareerCard[] = [
  {
    id: 'teacher',
    name: '托育园主班老师',
    emoji: '👩‍🏫',
    perspective: '入门 · 一线园内处置视角',
    duty: '接收家长线索，组织园内核查，形成整改方案并反馈结果。',
    legalTopic: '安全管理、健康照护、人格尊严',
    rarity: '稀有',
    playable: true,
  },
  {
    id: 'parent',
    name: '幼儿家长',
    emoji: '👨‍👩‍👧',
    perspective: '共情 · 普通民众维权视角',
    duty: '记录孩子情况，与园方沟通，并在问题未解决时向主管部门反映。',
    legalTopic: '知情沟通、证据留存、投诉渠道',
    rarity: '史诗',
    playable: true,
  },
  {
    id: 'inspector',
    name: '卫健局执法检查员',
    emoji: '👮‍♀️',
    perspective: '监管 · 行政检查处置视角',
    duty: '受理投诉、开展现场检查、形成整改要求并跟进复查。',
    legalTopic: '部门监管、现场检查、整改闭环',
    rarity: '史诗',
    playable: true,
  },
  {
    id: 'prosecutor',
    name: '未成年人检察官',
    emoji: '⚖️',
    perspective: '后置解锁 · 国家保护视角',
    duty: '在持续风险分支中复核线索，依法开展未成年人保护监督。',
    legalTopic: '未成年人综合保护、监督协同',
    rarity: '传说',
    playable: true,
    conditional: true,
  },
  {
    id: 'security',
    name: '园区保安',
    emoji: '👮',
    perspective: '完整版职业预览',
    duty: '落实门禁管理，核对接送身份，阻止无关人员进入幼儿活动区域。',
    legalTopic: '门禁与接送安全',
    rarity: '预览',
    playable: false,
  },
  {
    id: 'caregiver',
    name: '保育人员',
    emoji: '🧑‍⚕️',
    perspective: '完整版职业预览',
    duty: '承担日常生活照料，观察幼儿身体状态，发现异常及时报告。',
    legalTopic: '生活照料与健康观察',
    rarity: '预览',
    playable: false,
  },
  {
    id: 'sibling',
    name: '哥哥或姐姐',
    emoji: '🧒',
    perspective: '完整版职业预览',
    duty: '发现低龄儿童可能处于危险或不适时，及时告诉可信成年人。',
    legalTopic: '同伴观察与可信求助',
    rarity: '预览',
    playable: false,
  },
  {
    id: 'police',
    name: '办案民警',
    emoji: '👮‍♂️',
    perspective: '完整版职业预览',
    duty: '在人身危险或涉嫌违法犯罪的情形中，依法开展调查与保护。',
    legalTopic: '紧急保护与公安处置',
    rarity: '预览',
    playable: false,
  },
  {
    id: 'reporter',
    name: '民生小记者',
    emoji: '🎙️',
    perspective: '完整版职业预览',
    duty: '在保护儿童隐私的前提下，了解公共问题并开展合理社会监督。',
    legalTopic: '公益宣传、隐私保护、社会监督',
    rarity: '预览',
    playable: false,
  },
];

const teacherSteps: CaseStep[] = [
  {
    id: 'teacher-tip',
    kind: 'decision',
    kicker: '步骤 1 · 接收线索',
    title: '完整记录并回应家长',
    story: '放学时，一位家长展示孩子胳膊上的磕碰照片，并反映午睡巡查缺失、教职工大声训斥幼儿等情况。先留存可核实的材料，再决定如何启动处置。',
    sceneEmoji: '📱',
    prompt: '先勾选全部应留存材料，再选择处置方式',
    items: [
      { id: 'bruise-photo', label: '幼儿磕碰照片', recommended: true },
      { id: 'parent-statement', label: '家长口述投诉记录', recommended: true },
      { id: 'duty-roster', label: '班级近三日看护值班表', recommended: true },
    ],
    options: [
      {
        id: 'record-report',
        label: 'A  安抚家长，书面记录全部内容并立即上报园长',
        recommended: true,
        feedback: '处理得当。完整记录和及时上报能让核查有据可循。',
      },
      {
        id: 'verbal-only',
        label: 'B  只口头劝慰，不记录也不上报',
        recommended: false,
        feedback: '这会留下处理断点，家长也无法了解后续。请回溯并选择能够启动核查的做法。',
      },
      {
        id: 'avoid',
        label: 'C  回避问题，结束对话',
        recommended: false,
        feedback: '回避会让风险继续存在，并可能导致外部投诉。请回溯重选。',
      },
    ],
    legalNote: '托育机构应建立投诉回应和安全问题处置机制。',
  },
  {
    id: 'teacher-inspection',
    kind: 'evidence',
    kicker: '步骤 2 · 园内核查',
    title: '点击四处位置收集证据',
    story: '园长安排班级内部自查。检查活动区、午睡岗位台账、档案柜和教师访谈记录，确认问题是否真实存在。',
    sceneEmoji: '🔎',
    prompt: '完成全部现场核查',
    items: [
      { id: 'mat-damage', label: '活动区边角', detail: '发现两处防护软垫破损开裂。' },
      { id: 'nap-log', label: '午睡岗位台账', detail: '巡查记录存在大量漏填。' },
      { id: 'injury-log', label: '档案柜', detail: '没有幼儿受伤、身体不适处置登记本。' },
      { id: 'staff-interview', label: '教师休息室访谈', detail: '核实存在老师大声训斥幼儿的情况。' },
    ],
    actionLabel: '确认核查事实',
    successText: '事实确认：设施、巡查、伤情记录和教职工行为均存在需要整改的问题。',
  },
  {
    id: 'teacher-plan',
    kind: 'checklist',
    kicker: '步骤 3 · 拟定方案',
    title: '选择完整的整改措施',
    story: '根据已经确认的问题，形成可以执行、可以复查的书面整改方案。',
    sceneEmoji: '📝',
    prompt: '勾选所有需要落实的措施',
    items: [
      { id: 'replace-mat', label: '更换破损防护软垫', recommended: true },
      { id: 'nap-check', label: '落实午睡定时巡查并补齐台账', recommended: true },
      { id: 'staff-training', label: '培训教职工，禁止恐吓、训斥幼儿', recommended: true },
      { id: 'injury-system', label: '建立受伤和身体不适登记报告制度', recommended: true },
      { id: 'no-change', label: '维持现有模式，无需改动', recommended: false },
    ],
    actionLabel: '核对整改方案',
    successText: '整改方案覆盖了核查发现的四类问题，可以向家长如实反馈。',
    legalNote: '草案科普：服务安全、健康照护和人格尊严都需要落实到日常制度与记录中。',
  },
  {
    id: 'teacher-feedback',
    kind: 'decision',
    kicker: '步骤 4 · 沟通反馈',
    title: '怎样向投诉家长说明结果',
    story: '园方邀请家长到场，需要说明自查发现和整改安排。',
    sceneEmoji: '🤝',
    prompt: '请选择沟通方式',
    options: [
      {
        id: 'transparent',
        label: 'A  如实说明全部发现，出示书面方案并听取家长诉求',
        recommended: true,
        feedback: '家长了解了事实和可检查的整改安排，双方形成后续复查共识。',
      },
      {
        id: 'hide',
        label: 'B  隐瞒部分问题，只作口头提醒',
        recommended: false,
        feedback: '信息不完整会削弱信任，也无法证明整改已启动。请回溯重选。',
      },
      {
        id: 'blame',
        label: 'C  指责家长小题大做',
        recommended: false,
        feedback: '指责不能解决安全问题，还会激化矛盾。请回溯重选。',
      },
    ],
  },
  {
    id: 'teacher-document',
    kind: 'document',
    kicker: '步骤 5 · 结案归档',
    title: '内部妥善处置结局',
    story: '园方完成内部核查，制定并启动整改，向家长反馈后形成闭环记录。',
    sceneEmoji: '✅',
    documentTitle: '星星托育园家长投诉看护缺位一案结案记录',
    documentLines: [
      '核查范围：安全设施、午睡巡查台账、伤情处置记录、教职工言行。',
      '整改事项：更换设施、补齐巡查、建立登记制度、规范教育行为。',
      '沟通结果：向家长如实反馈，明确复查安排，事件进入跟踪闭环。',
    ],
    legalNote: '本记录为游戏内普法示例，不是具有法律效力的正式文书。',
  },
];

const parentSteps: CaseStep[] = [
  {
    id: 'parent-discovery',
    kind: 'checklist',
    kicker: '步骤 1 · 发现线索',
    title: '先记录可以观察到的事实',
    story: '连续一周，孩子回家时身上出现磕碰痕迹，并反映午睡时长时间没有老师巡查、有人大声凶同学。',
    sceneEmoji: '🧒',
    prompt: '把两项材料存入证据笔记本',
    items: [
      { id: 'parent-photo', label: '孩子身体磕碰照片', recommended: true },
      { id: 'child-statement', label: '孩子口述情况记录', recommended: true },
    ],
    actionLabel: '保存材料',
    successText: '已记录客观情况。注意保护儿童隐私，不在公开网络传播可识别信息。',
  },
  {
    id: 'parent-contact',
    kind: 'decision',
    kicker: '步骤 2 · 首次交涉',
    title: '怎样向园方提出问题',
    story: '你来到托育园，希望了解孩子磕碰和巡查缺失的原因。',
    sceneEmoji: '🏫',
    prompt: '请选择沟通方式',
    options: [
      {
        id: 'written-response',
        label: 'A  出示材料，要求园方自查并提供书面回复',
        recommended: true,
        feedback: '诉求具体、材料清楚，便于园方核查和后续跟进。园方目前只作口头安抚，问题尚未解决。',
      },
      {
        id: 'argue',
        label: 'B  激烈争吵，不提出明确诉求',
        recommended: false,
        feedback: '情绪表达可以理解，但缺少明确诉求和书面记录不利于解决问题。请回溯重选。',
      },
      {
        id: 'silence',
        label: 'C  担心影响孩子，闭口不提',
        recommended: false,
        feedback: '持续风险需要大人核实和处理。请回溯并选择安全、可记录的沟通方式。',
      },
    ],
  },
  {
    id: 'parent-complaint',
    kind: 'decision',
    kicker: '步骤 3 · 正式反映',
    title: '园方迟迟没有整改，怎么办',
    story: '一段时间过去，园方仍只有口头安抚，没有书面自查结果，也没有看到实际改进。',
    sceneEmoji: '📨',
    prompt: '请选择下一步',
    options: [
      {
        id: 'formal-complaint',
        label: 'A  整理材料，向属地托育服务主管部门正式反映',
        recommended: true,
        feedback: '投诉材料已按时间和事实整理，案件进入主管部门受理环节。',
      },
      {
        id: 'give-up',
        label: 'B  觉得麻烦，就此放弃',
        recommended: false,
        feedback: '问题没有消失。可以请可信成年人协助，通过属地公开渠道反映。',
      },
      {
        id: 'public-post',
        label: 'C  直接公开孩子照片和身份信息发帖',
        recommended: false,
        feedback: '公开传播可能暴露儿童隐私。应先保护身份信息，再使用正式反映渠道。',
      },
    ],
    legalNote: '各地具体受理部门和流程可能不同，应以属地政府公开信息为准。',
  },
  {
    id: 'parent-submit',
    kind: 'briefing',
    kicker: '步骤 4 · 配合调查',
    title: '向主管部门提交完整材料',
    story: '主管部门受理后开展现场检查。作为投诉人，你需要完整陈述情况，并提交已保存的照片和口述记录。',
    sceneEmoji: '📚',
    evidenceToAdd: [
      { id: 'complaint-receipt', label: '正式投诉受理记录' },
      { id: 'investigation-statement', label: '投诉人情况说明' },
    ],
    actionLabel: '提交证据并完整陈述',
    successText: '材料已提交，主管部门将结合现场检查结果作出处理。',
  },
  {
    id: 'parent-result',
    kind: 'branch',
    kicker: '步骤 5 · 接收结果',
    title: '查看案件的两种后续',
    story: '主管部门完成检查并提出整改要求。选择一条分支，了解不同履行结果会怎样推动案件发展。',
    sceneEmoji: '🧭',
    prompt: '选择要体验的结局分支',
    options: [
      {
        id: 'rectified',
        label: 'A  园方按期整改，家长确认隐患已经消除',
        recommended: true,
        feedback: '维权成功结局：投诉材料被受理，问题完成整改并形成闭环。',
        ending: '维权成功结局',
      },
      {
        id: 'refused',
        label: 'B  园方拒不整改，风险持续存在',
        recommended: true,
        feedback: '持续风险分支：相关线索进入进一步监督协同，未成年人检察官职业已解锁。',
        ending: '案件流转结局',
        unlockProsecutor: true,
      },
    ],
  },
];

const inspectorSteps: CaseStep[] = [
  {
    id: 'inspector-file',
    kind: 'briefing',
    kicker: '步骤 1 · 接收卷宗',
    title: '登记受理群众投诉',
    story: '你收到关于星星托育园看护缺位、设施隐患和教职工行为的投诉材料，需要先登记并核对卷宗。',
    sceneEmoji: '📁',
    evidenceToAdd: [
      { id: 'official-photo', label: '投诉附带照片' },
      { id: 'official-statement', label: '儿童情况陈述' },
      { id: 'official-complaint', label: '正式投诉材料' },
    ],
    actionLabel: '登记并导入卷宗',
    successText: '案件已受理，卷宗材料已经导入证据笔记本。',
  },
  {
    id: 'inspector-site',
    kind: 'evidence',
    kicker: '步骤 2 · 现场勘验',
    title: '检查现场并匹配问题类型',
    story: '进入托育园开展现场检查。每个证据点都对应不同的管理责任。',
    sceneEmoji: '🏢',
    prompt: '点击全部证据点完成现场检查',
    items: [
      { id: 'official-mat', label: '活动区', detail: '防护软垫破损，属于设施安全隐患。' },
      { id: 'official-nap', label: '办公室台账', detail: '午睡巡查记录大量漏填，制度没有落实。' },
      { id: 'official-injury', label: '档案柜', detail: '没有受伤处置登记，健康异常缺少记录。' },
      { id: 'official-interview', label: '教职工访谈', detail: '核实存在大声训斥幼儿的情况。' },
    ],
    actionLabel: '形成现场检查记录',
    successText: '四项问题已经查清，可进入行政处理决定环节。',
    legalNote: '草案科普：设施安全、健康处置、照护记录和人格尊严属于不同的合规检查重点。',
  },
  {
    id: 'inspector-decision',
    kind: 'decision',
    kicker: '步骤 3 · 处理决定',
    title: '事实查清后如何处理',
    story: '现场检查记录已经完成，需要选择与事实和程序相匹配的处理方式。',
    sceneEmoji: '📋',
    prompt: '请选择处理决定',
    options: [
      {
        id: 'written-order',
        label: 'A  形成书面整改要求，列明事项、期限并安排复查',
        recommended: true,
        feedback: '处理措施与已查清的问题一一对应，也保留了后续复查依据。',
      },
      {
        id: 'oral-warning',
        label: 'B  仅口头提醒，不留记录',
        recommended: false,
        feedback: '口头提醒无法形成完整监管闭环。请回溯并选择可跟踪、可复查的方式。',
      },
      {
        id: 'unrelated-punishment',
        label: 'C  不核对依据，直接作出与事实不相称的处理',
        recommended: false,
        feedback: '行政处理需要事实和程序依据。请回溯重选。',
      },
    ],
  },
  {
    id: 'inspector-review',
    kind: 'branch',
    kicker: '步骤 4 · 到期复查',
    title: '复查结果决定案件走向',
    story: '整改期限届满。选择一条复查结果，观察案件是归档还是进入进一步监督协同。',
    sceneEmoji: '🔁',
    prompt: '选择要体验的复查分支',
    options: [
      {
        id: 'review-passed',
        label: 'A  设施、台账和人员管理全部整改到位',
        recommended: true,
        feedback: '行政监管妥善处置结局：问题整改完成，案件归档。',
        ending: '行政监管妥善处置结局',
      },
      {
        id: 'review-failed',
        label: 'B  园方拒不整改，安全风险持续存在',
        recommended: true,
        feedback: '持续风险分支：卷宗进入进一步监督协同，未成年人检察官职业已解锁。',
        ending: '持续风险流转结局',
        unlockProsecutor: true,
      },
    ],
    legalNote: '游戏中的流程经过简化，不等同于真实行政处理程序或案件移送条件。',
  },
];

const prosecutorSteps: CaseStep[] = [
  {
    id: 'prosecutor-file',
    kind: 'briefing',
    kicker: '步骤 1 · 接收线索',
    title: '接收持续风险卷宗',
    story: '园方在整改要求提出后仍未消除风险。你接收家长材料、现场检查记录和整改跟进材料。',
    sceneEmoji: '⚖️',
    evidenceToAdd: [
      { id: 'prosecutor-parent', label: '家长证据材料' },
      { id: 'prosecutor-inspection', label: '现场检查记录' },
      { id: 'prosecutor-order', label: '整改要求及复查材料' },
    ],
    actionLabel: '调取完整卷宗',
    successText: '卷宗已导入，可以复核事实与持续风险。',
  },
  {
    id: 'prosecutor-review',
    kind: 'review',
    kicker: '步骤 2 · 复核事实',
    title: '确认四项关键事实',
    story: '逐项阅读材料，确认哪些事实已有证据支持。',
    sceneEmoji: '📖',
    prompt: '逐项确认卷宗事实',
    items: [
      { id: 'fact-safety', label: '活动区设施存在安全隐患' },
      { id: 'fact-records', label: '午睡巡查与受伤处置记录缺失' },
      { id: 'fact-dignity', label: '存在不当训斥幼儿的行为' },
      { id: 'fact-persistent', label: '整改后复查发现风险仍然持续' },
    ],
    actionLabel: '完成事实复核',
    successText: '关键事实已逐项确认，可以进入监督方式选择。',
    legalNote: '未成年人权益受到国家、社会、学校和家庭等多方面保护。',
  },
  {
    id: 'prosecutor-action',
    kind: 'decision',
    kicker: '步骤 3 · 选择方式',
    title: '怎样推动持续风险得到解决',
    story: '结合卷宗事实和职责边界，选择与案件问题相关的监督方式。',
    sceneEmoji: '🧾',
    prompt: '请选择办理方式',
    options: [
      {
        id: 'prosecutorial-recommendation',
        label: 'A  依法开展监督，提出有针对性的检察建议并持续跟进',
        recommended: true,
        feedback: '选择与持续风险和未成年人保护目标相匹配，进入落实跟进。',
      },
      {
        id: 'shelve',
        label: 'B  搁置线索，不再核查',
        recommended: false,
        feedback: '卷宗显示风险仍在持续，需要依法履行相应监督职责。请回溯重选。',
      },
      {
        id: 'unrelated',
        label: 'C  提出与案件事实无关的处理要求',
        recommended: false,
        feedback: '监督措施应当围绕已经查明的事实。请回溯重选。',
      },
    ],
    legalNote: '游戏仅呈现普法逻辑，真实检察监督须依据法定职责、条件和程序开展。',
  },
  {
    id: 'prosecutor-follow',
    kind: 'briefing',
    kicker: '步骤 4 · 跟进落实',
    title: '查看整改反馈',
    story: '相关单位反馈整改进展：防护设施已经修复，值班与伤情台账补齐，教职工教育行为得到规范。',
    sceneEmoji: '🌱',
    evidenceToAdd: [
      { id: 'follow-report', label: '整改落实反馈' },
      { id: 'follow-review', label: '复查确认记录' },
    ],
    actionLabel: '确认落实情况',
    successText: '整改结果已核实，持续风险得到消除。',
  },
  {
    id: 'prosecutor-document',
    kind: 'document',
    kicker: '步骤 5 · 终局结案',
    title: '未成年人保护闭环结局',
    story: '家长反映、行政监管与未成年人保护监督形成协同，园区风险最终得到整改。',
    sceneEmoji: '🏆',
    documentTitle: '未成年人保护监督结案摘要',
    documentLines: [
      '事实基础：设施、巡查记录、健康处置记录和教职工行为问题。',
      '监督重点：推动相关单位履行保护职责并落实针对性整改。',
      '结案结果：整改事项完成复查，婴幼儿持续风险得到消除。',
    ],
    legalNote: '本摘要为游戏化普法示例，不是正式检察法律文书。',
  },
];

export const roleSteps: Record<PlayableRoleId, CaseStep[]> = {
  teacher: teacherSteps,
  parent: parentSteps,
  inspector: inspectorSteps,
  prosecutor: prosecutorSteps,
};

export const roleCardReward: Record<PlayableRoleId, string> = {
  teacher: '尽责托育老师',
  parent: '儿童权益守护者',
  inspector: '托育安全监督员',
  prosecutor: '少年检察官',
};
