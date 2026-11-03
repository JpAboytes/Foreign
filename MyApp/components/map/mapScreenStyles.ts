import { StyleSheet } from 'react-native';

// Estilos mejorados para MapScreen.tsx
export const styles = StyleSheet.create({
  // Contenedores principales
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#121212' 
  },
  loadingText: { 
    color: '#fff', 
    marginTop: 12, 
    fontSize: 16, 
    fontWeight: '500',
    letterSpacing: 0.5
  },
  
  // Header y filtros
  header: { 
    backgroundColor: '#1e1e1e', 
    paddingVertical: 12, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  chipsContainer: {
    paddingVertical: 4,
  },
  chipsContent: { 
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  chipSelected: { 
    backgroundColor: '#bb86fc', 
    borderColor: '#bb86fc',
    elevation: 3,
  },
  chipText: { 
    color: '#ddd', 
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: { 
    color: '#121212', 
    fontWeight: 'bold' 
  },
  confirmButton: {
    backgroundColor: '#FF4081',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 12,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  confirmButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14,
    letterSpacing: 0.5,
  },
  
  // Mapa
  mapContainer: { 
    flex: 1,
    overflow: 'hidden',
  },
  map: { 
    flex: 1,
  },
  
  // Botones flotantes
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#bb86fc',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 150,
  },
  addButtonText: { 
    color: '#121212', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  raiteButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#FF4081',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 150,
  },
  raiteButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  
  // Overlays
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    width: '90%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#bb86fc',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalMessage: { 
    color: '#ddd', 
    marginBottom: 20, 
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    fontSize: 16,
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonCancel: { 
    backgroundColor: '#333',
  },
  modalButtonText: { 
    color: '#121212', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  
  // Lista de amigos
  friendsList: { 
    maxHeight: 250, 
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    padding: 8,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    marginVertical: 2,
  },
  friendText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '500',
  },
  checkMark: { 
    color: '#4CAF50', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  
  // Selección de imágenes
  galleryButton: {
    backgroundColor: '#4f0c2e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  // Información del lugar
  ownerInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  ownerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#bb86fc',
    backgroundColor: '#333',
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
  placeImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalDescription: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 20,
    textAlign: 'left',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  modalRating: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 24,
    fontWeight: '600',
  },
  modalContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  modalTitleM: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 16,
    textAlign: 'center',
  },
  //noti raite
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4081',
    borderWidth: 2,
    borderColor: '#121212',
    zIndex: 2,
  },
  
  
  // Estrellas de calificación
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  starButton: {
    padding: 5,
  },
  starIcon: {
    fontSize: 32,
  },
  
  // Imágenes seleccionadas
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  selectedImagePreview: {
    width: 80,
    height: 80,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bb86fc',
  },
  viewRouteButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    alignSelf: 'center',
  },
  viewRouteText: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: '600',
  },
  pillBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#FF4081',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  pillBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  webDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  downloadButton: {
    backgroundColor: '#FF4081',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
