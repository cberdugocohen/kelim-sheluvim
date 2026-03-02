/**
 * Convert student profile contributions to normalized service objects.
 * Replaces 4 duplicate implementations across Home.jsx, CommunityHub.jsx,
 * ServiceApproval.jsx, and ServiceStatistics.jsx.
 */
export function convertStudentContributionsToServices(students) {
  const services = [];

  try {
    students.forEach(student => {
      if (!student || !student.id) return;

      // New structure: student.services array
      if (student.services && Array.isArray(student.services)) {
        student.services.forEach(service => {
          if (service && service.is_active) {
            services.push({
              id: service.id || `student-service-${student.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: service.title || 'שירות ללא כותרת',
              description: service.description || student.description || '',
              category: service.category || student.service_areas?.[0] || 'כללי',
              geographic_area: service.geographic_area || student.city || 'לא צוין',
              price: service.type === 'gift' ? 'התנדבות' : (service.type === 'paid' ? (service.price_range || 'בתשלום') : 'בארטר'),
              images: service.images || (student.profile_image ? [student.profile_image] : []),
              is_approved: true,
              provider_id: student.user_id,
              provider_name: student.full_name || student.username || 'חברת קהילה',
              provider_image: student.profile_image,
              source: 'profile_new',
              is_holiday_highlight: service.is_holiday_highlight,
              holiday_type: service.holiday_type,
              student_id: student.id,
              student_user_id: student.user_id,
              student_name: student.full_name || student.username,
              student_profile: student
            });
          }
        });
      }

      // Old structure: student.contribution_details
      if (!student.contribution_details) return;

      const { gift, paid, barter } = student.contribution_details;

      const createStudentService = (type, details) => {
        try {
          const uniqueId = `student-${type}-${student.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          return {
            id: uniqueId,
            title: details.description || 'שירות ללא תיאור',
            description: details.details || student.description || '',
            category: details.category || student.service_areas?.[0] || 'כללי',
            geographic_area: details.geographic_area || student.city || 'לא צוין',
            price: type === 'gift' ? 'התנדבות' : (type === 'paid' ? (details.price_range || 'בתשלום') : 'בארטר'),
            images: details.images || (student.profile_image ? [student.profile_image] : []),
            is_approved: true,
            provider_id: student.user_id,
            provider_name: student.full_name || student.username || 'חברת קהילה',
            provider_image: student.profile_image,
            source: 'profile_old',
            is_holiday_highlight: details.is_holiday_highlight,
            holiday_type: details.holiday_type,
            student_id: student.id,
            student_user_id: student.user_id,
            student_name: student.full_name || student.username,
            student_profile: student
          };
        } catch (error) {
          console.error(`Error creating service from old structure for student ${student.id}:`, error);
          return null;
        }
      };

      if (gift?.active && gift?.description) {
        const service = createStudentService('gift', gift);
        if (service) services.push(service);
      }

      if (paid?.active && paid?.description) {
        const service = createStudentService('paid', paid);
        if (service) services.push(service);
      }

      if (barter?.active && barter?.description) {
        const service = createStudentService('barter', barter);
        if (service) services.push(service);
      }
    });
  } catch (error) {
    console.error("Error in convertStudentContributionsToServices:", error);
  }

  return services;
}
