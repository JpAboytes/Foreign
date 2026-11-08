import { StyleSheet } from 'react-native';

export const adminStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  // Fixed height container for category selector
  categorySelectorContainer: {
    height: 64, // Fixed height that accommodates the category buttons
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'center', // Center the ScrollView vertically
  },
  categorySelectorContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center', // Ensure all items are vertically centered
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#222',
    height: 40, // Fixed height for all buttons
    minWidth: 100, // Minimum width to ensure consistent sizing
  },
  categoryButtonActive: {
    backgroundColor: '#b388ff33',
  },
  categoryIconContainer: {
    marginRight: 8,
    width: 24, // Fixed width for icon container
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#b388ff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#222',
  },
  sortButtonActive: {
    backgroundColor: '#b388ff33',
  },
  sortButtonText: {
    color: '#999',
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: '#b388ff',
  },
  sortOrderButton: {
    padding: 6,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    color: '#999',
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  locationIconContainer: {
    marginRight: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#b388ff33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#b388ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  itemMeta: {
    color: '#b388ff',
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2a2a2a',
  },
  deleteButton: {
    backgroundColor: '#5c2b29',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b388ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#b388ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // New styles for posts and locations
  postImageContainer: {
    marginRight: 12,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  postStatText: {
    color: '#b388ff',
    fontSize: 12,
    marginLeft: 4,
  },
  locationImageContainer: {
    marginRight: 12,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  locationThumbnail: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#b388ff',
    fontSize: 10,
    fontWeight: '500',
  },
});
