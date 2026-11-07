import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import type {
  AdminCategory,
  AdminItem,
  AdminUser,
  AdminMentor,
  AdminPost,
  AdminLocation,
  AdminForum,
} from '../../services/adminService';
import { adminStyles as styles } from './adminStyles';

interface Props {
  category: AdminCategory;
  item: AdminItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function Avatar({ photoURL, name }: { photoURL?: string; name?: string }) {
  return (
    <View style={styles.avatarContainer}>
      {photoURL ? (
        <Image cachePolicy="memory-disk" transition={200} source={{ uri: photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.defaultAvatar]}>
          <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
        </View>
      )}
    </View>
  );
}

function UserInfo({ user }: { user: AdminUser }) {
  return (
    <>
      <Avatar photoURL={user.photoURL} name={user.name} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{user.name || 'Sin nombre'}</Text>
        <Text style={styles.itemSubtitle}>{user.email || 'Sin email'}</Text>
        {user.role && <Text style={styles.itemMeta}>{user.role}</Text>}
      </View>
    </>
  );
}

function MentorInfo({ mentor }: { mentor: AdminMentor }) {
  return (
    <>
      <Avatar photoURL={mentor.photoURL} name={mentor.name} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{mentor.name || 'Sin nombre'}</Text>
        <Text style={styles.itemSubtitle}>{mentor.areas?.join(', ') || 'Sin especialidad'}</Text>
      </View>
    </>
  );
}

function PostInfo({ post }: { post: AdminPost }) {
  return (
    <>
      {post.image && (
        <View style={styles.postImageContainer}>
          <Image cachePolicy="memory-disk" transition={200} source={{ uri: post.image }} style={styles.postThumbnail} contentFit="cover" />
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{post.caption || 'Sin título'}</Text>
        <Text style={styles.itemSubtitle}>Por: {post.userName || 'Anónimo'}</Text>
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Ionicons name="heart" size={14} color="#b388ff" />
            <Text style={styles.postStatText}>{post.likesCount}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function LocationInfo({ location }: { location: AdminLocation }) {
  return (
    <>
      {location.imageUrl && (
        <View style={styles.locationImageContainer}>
          <Image cachePolicy="memory-disk" transition={200} source={{ uri: location.imageUrl }} style={styles.locationThumbnail} contentFit="cover" />
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{location.title || 'Sin nombre'}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={2}>
          {location.description || 'Sin descripción'}
        </Text>
        {location.geoPoint && (
          <Text style={styles.itemMeta}>
            {location.geoPoint.latitude.toFixed(4)}, {location.geoPoint.longitude.toFixed(4)}
          </Text>
        )}
        {location.type && location.type.length > 0 && (
          <View style={styles.tagContainer}>
            {location.type.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

function ForumInfo({ forum }: { forum: AdminForum }) {
  return (
    <View style={styles.itemDetails}>
      <Text style={styles.itemTitle}>{forum.title || 'Sin título'}</Text>
      <Text style={styles.itemMeta}>Por: {forum.authorName || 'Anónimo'}</Text>
    </View>
  );
}

function renderInfo(category: AdminCategory, item: AdminItem) {
  switch (category) {
    case 'users':
      return <UserInfo user={item as AdminUser} />;
    case 'mentors':
      return <MentorInfo mentor={item as AdminMentor} />;
    case 'posts':
      return <PostInfo post={item as AdminPost} />;
    case 'locations':
      return <LocationInfo location={item as AdminLocation} />;
    case 'forums':
      return <ForumInfo forum={item as AdminForum} />;
    default:
      return null;
  }
}

export default function AdminItemCard({ category, item, onEdit, onDelete }: Props) {
  if (!['users', 'mentors', 'posts', 'locations', 'forums'].includes(category)) return null;
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>{renderInfo(category, item)}</View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEdit(item.id)}>
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(item.id)}>
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
