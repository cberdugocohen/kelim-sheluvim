import { useQuery } from '@tanstack/react-query';
import { apiCallWithRetry } from '@/utils/apiRetry';
import { User } from '@/entities/User';
import { Student } from '@/entities/Student';
import { SpotlightRequest } from '@/entities/SpotlightRequest';
import { HolidaySection } from '@/entities/HolidaySection';
import { Service } from '@/entities/Service';
import { CommunityPost } from '@/entities/CommunityPost';
import { GratitudePost } from '@/entities/GratitudePost';
import { convertStudentContributionsToServices } from '@/utils/studentServices';

/**
 * Shell data: current user, spotlight, holiday section.
 * Loaded first, lightweight.
 */
export function useHomeShell() {
  return useQuery({
    queryKey: ['home', 'shell'],
    queryFn: async () => {
      const [currentUserRes, spotlightRes, holidayRes] = await Promise.all([
        apiCallWithRetry(() => User.me(), 1, 2000, 10000).catch(() => null),
        apiCallWithRetry(
          () => SpotlightRequest.filter({ status: 'selected' }, '-created_date', 1),
          1, 2000, 10000
        ).catch(() => []),
        apiCallWithRetry(() => HolidaySection.filter({ is_active: true }, '-created_date', 1), 1, 2000, 10000).catch(() => []),
      ]);

      let spotlightUser = null;
      if (spotlightRes.length > 0) {
        const spotlight = spotlightRes[0];
        let fullName = 'חברת קהילה';
        let profileImage = (spotlight.images?.length > 0) ? spotlight.images[0] : null;

        const students = await apiCallWithRetry(
          () => Student.filter({ user_id: spotlight.user_id }),
          1, 2000, 10000
        ).catch(() => []);

        if (students.length > 0) {
          fullName = students[0].full_name || students[0].username || 'חברת קהילה';
          profileImage = profileImage || students[0].profile_image;
        }

        spotlightUser = { ...spotlight, full_name: fullName, profile_image: profileImage };
      }

      return {
        currentUser: currentUserRes,
        spotlightUser,
        holidaySection: holidayRes.length > 0 ? holidayRes[0] : null,
      };
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

/**
 * Content data: posts, gratitudes, services, users count, authors.
 * Loaded after shell, heavier.
 */
export function useHomeContent(holidaySection) {
  return useQuery({
    queryKey: ['home', 'content'],
    queryFn: async () => {
      // Phase 1: posts, gratitudes, users count
      const [postsRes, gratitudesRes, allUsersRes] = await Promise.all([
        apiCallWithRetry(() => CommunityPost.filter({ is_active: true }, '-created_date', 3), 2, 3000, 45000)
          .catch(() => []),
        apiCallWithRetry(() => GratitudePost.filter({ is_public: true }, '-created_date', 3), 2, 3000, 45000)
          .catch(() => []),
        apiCallWithRetry(() => User.list('-created_date'), 1, 3000, 30000)
          .catch(() => []),
      ]);

      // Phase 2: services + students
      const [allServicesRes, studentsRes] = await Promise.all([
        apiCallWithRetry(() => Service.filter({ is_approved: true }, '-created_date'), 2, 2000, 20000)
          .catch(() => []),
        apiCallWithRetry(() => Student.list('-created_date'), 2, 2000, 20000)
          .catch(() => []),
      ]);

      const studentServices = convertStudentContributionsToServices(studentsRes);
      const combinedServices = [...allServicesRes, ...studentServices];

      // Holiday services
      let holidayServices = [];
      if (holidaySection?.is_active) {
        holidayServices = combinedServices.filter(
          (s) => s.is_holiday_highlight && s.holiday_type === holidaySection.current_holiday
        ).slice(0, 6);
      }

      // Filter quality posts (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentPosts = postsRes.filter((post) => {
        if (!post?.content || post.content.length < 15 || !post.author_id) return false;
        return new Date(post.created_date) >= twoWeeksAgo;
      });

      const recentGratitudes = gratitudesRes.filter((g) => {
        if (!g?.content || !g.sender_id || !g.recipient_id) return false;
        return new Date(g.created_date) >= twoWeeksAgo;
      });

      // Phase 3: batch-load authors
      const uniqueAuthorIds = new Set([
        ...recentPosts.map((p) => p.author_id).filter(Boolean),
        ...recentGratitudes.map((g) => g.sender_id).filter(Boolean),
        ...recentGratitudes.map((g) => g.recipient_id).filter(Boolean),
      ]);

      const authorsMap = {};
      if (uniqueAuthorIds.size > 0) {
        const allAuthorStudents = await apiCallWithRetry(
          () => Student.filter_in('user_id', Array.from(uniqueAuthorIds)),
          1, 2000, 15000
        ).catch(() => []);

        allAuthorStudents.forEach((student) => {
          if (student.user_id) {
            authorsMap[student.user_id] = {
              id: student.user_id,
              full_name: student.full_name || student.username,
              profile_image: student.profile_image,
            };
          }
        });
      }

      return {
        recentPosts,
        recentGratitudes,
        allAuthors: authorsMap,
        allServices: combinedServices,
        holidayServices,
        stats: {
          services: combinedServices.length,
          users: allUsersRes.length || 139,
          posts: recentPosts.length,
          gratitudes: recentGratitudes.length,
        },
      };
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
