const AppHeader = ({ onMenuPress, title }) => (
    <View style={styles.appHeader}>
      <TouchableOpacity onPress={onMenuPress} style={styles.headerButton}>
        <MenuIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );