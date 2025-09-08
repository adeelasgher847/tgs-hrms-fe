import { Avatar } from '@mui/material';
import TopPerformers from './TopPerformers';
import { Email, Person, Code } from '@mui/icons-material';
import { useLanguage } from '../../../hooks/useLanguage';

const TopPerformersProps = () => {
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Top Performers',
      subtitle: 'You have 140 influencers in your company.',
      newTaskLabel: 'New Task',
      completedTaskLabel: 'Task Completed',
      performers: [
        { name: 'Ali Raza', email: '@ali', percentage: 85 },
        { name: 'Sara Khan', email: '@sara', percentage: 92 },
        { name: 'Usman Tariq', email: '@usman', percentage: 76 },
        { name: 'Hassan Ali', email: '@hassan', percentage: 76 },
        { name: 'Ahmed Iqbal', email: '@ahmed', percentage: 76 },
        { name: 'Bilal Khan', email: '@bilal', percentage: 76 },
      ],
    },
    ar: {
      title: 'أفضل المؤدين',
      subtitle: 'لديك 140 مؤثرًا في شركتك.',
      newTaskLabel: 'مهمة جديدة',
      completedTaskLabel: 'المهام المكتملة',
      performers: [
        { name: 'علي رضا', email: '@علي', percentage: 85 },
        { name: 'سارة خان', email: '@سارة', percentage: 92 },
        { name: 'عثمان طارق', email: '@عثمان', percentage: 76 },
        { name: 'حسن علي', email: '@حسن', percentage: 76 },
        { name: 'أحمد اقبال', email: '@أحمد', percentage: 76 },
        { name: 'بلال خان', email: '@بلال', percentage: 76 },
      ],
    },
  };

  // Add icons to performers
  const performerData = labels[language].performers.map((person, _index) => {
    let icon;
    if (_index === 0) icon = <Person />;
    else if (_index === 1) icon = <Email />;
    else if (_index === 2) icon = <Code />;
    else if (_index === 5) {
      icon = <Avatar alt={person.name} src='/static/images/avatar/2.jpg' />;
    } else {
      icon = <Code />;
    }

    return {
      ...person,
      icon,
    };
  });

  return (
    <TopPerformers
      title={labels[language].title}
      subtitle={labels[language].subtitle}
      newTask={350}
      completedTask={130}
      newTaskLabel={labels[language].newTaskLabel}
      completedTaskLabel={labels[language].completedTaskLabel}
      performers={performerData}
    />
  );
};

export default TopPerformersProps;
