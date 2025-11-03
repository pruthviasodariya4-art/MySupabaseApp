import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  style?: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ style }) => {
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animateDot = (
      dotAnim: Animated.Value,
      delay: number,
    ): Animated.CompositeAnimation => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animations = Animated.parallel([
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 150),
      animateDot(dot3Anim, 300),
    ]);

    animations.start();

    return () => {
      animations.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[styles.dot, { opacity: dot1Anim }]}
          />
          <Animated.View
            style={[styles.dot, { opacity: dot2Anim }]}
          />
          <Animated.View
            style={[styles.dot, { opacity: dot3Anim }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
});
